import "dotenv/config";

import { parseCommonArgs } from "../lib/scrapers/args";
import { writeErrorLog } from "../lib/scrapers/error-log";
import { importProducts } from "../lib/scrapers/import-products";
import type { RawProductInput } from "../lib/normalizers/normalize-product";
import type { Json } from "../lib/types/database";

const API_URL = "https://api.producthunt.com/v2/api/graphql";
const TOPICS = [
  "artificial-intelligence",
  "developer-tools",
  "productivity",
  "design-tools",
  "no-code",
] as const;

interface ProductHuntPost {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  url: string;
  website: string;
  createdAt: string;
  dailyRank: number | null;
  votesCount: number;
  commentsCount: number;
  reviewsRating: number;
  thumbnail: { url: string } | null;
  topics: { nodes: Array<{ name: string; slug: string }> };
}

interface ProductHuntResponse {
  data?: {
    posts: {
      nodes: ProductHuntPost[];
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
    };
  };
  errors?: Array<{ message: string }>;
}

const POSTS_QUERY = `
  query RecentTopicPosts(
    $topic: String!
    $first: Int!
    $after: String
    $postedAfter: DateTime!
  ) {
    posts(
      topic: $topic
      first: $first
      after: $after
      postedAfter: $postedAfter
      order: NEWEST
    ) {
      nodes {
        id
        name
        tagline
        description
        url
        website
        createdAt
        dailyRank
        votesCount
        commentsCount
        reviewsRating
        thumbnail { url }
        topics(first: 20) {
          nodes { name slug }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

function parseArgs(argv: string[]) {
  const common = parseCommonArgs(argv, { limit: 100 });
  let days = 90;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--days") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--days must be a positive integer");
      }
      days = value;
      index += 1;
    }
  }

  return { ...common, days };
}

async function fetchTopicPage(
  token: string,
  topic: string,
  first: number,
  after: string | null,
  postedAfter: string,
): Promise<ProductHuntResponse["data"]> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: POSTS_QUERY,
      variables: { topic, first, after, postedAfter },
    }),
  });

  const payload = (await response.json()) as ProductHuntResponse;
  if (!response.ok || payload.errors?.length || !payload.data) {
    const details =
      payload.errors?.map((error) => error.message).join("; ") ??
      `${response.status} ${response.statusText}`;
    throw new Error(`Product Hunt API request failed: ${details}`);
  }

  return payload.data;
}

async function fetchProductHuntPosts(
  token: string,
  limit: number,
  days: number,
): Promise<RawProductInput[]> {
  const postedAfter = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
  const posts = new Map<string, RawProductInput>();

  for (const topic of TOPICS) {
    let cursor: string | null = null;

    while (posts.size < limit) {
      const pageSize = Math.min(20, limit - posts.size);
      const data = await fetchTopicPage(
        token,
        topic,
        pageSize,
        cursor,
        postedAfter,
      );
      const page = data!.posts;

      for (const post of page.nodes) {
        if (posts.has(post.id)) {
          continue;
        }

        const topicNames = post.topics.nodes.map((item) => item.name);
        posts.set(post.id, {
          source_name: "Product Hunt",
          name: post.name,
          website_url: post.website,
          tagline: post.tagline,
          description: post.description,
          logo_url: post.thumbnail?.url,
          category: topicNames[0] ?? topic,
          tags: topicNames,
          source_url: post.url,
          list_name: `${topic} recent launches`,
          list_type: "topic",
          rank_position: post.dailyRank,
          upvotes: post.votesCount,
          comments: post.commentsCount,
          rating: post.reviewsRating || null,
          snapshot_date: new Date().toISOString(),
          raw_data: post as unknown as Json,
        });

        if (posts.size >= limit) {
          break;
        }
      }

      if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) {
        break;
      }
      cursor = page.pageInfo.endCursor;
    }

    if (posts.size >= limit) {
      break;
    }
  }

  return [...posts.values()].slice(0, limit);
}

async function main() {
  const { limit, dryRun, days } = parseArgs(process.argv.slice(2));
  const token = process.env.PRODUCT_HUNT_TOKEN;

  if (!token) {
    throw new Error(
      "Missing PRODUCT_HUNT_TOKEN. Create a developer token in the Product Hunt API dashboard.",
    );
  }

  const products = await fetchProductHuntPosts(token, limit, days);
  const stats = await importProducts(products, {
    dryRun,
    onProductError: (product, error) =>
      writeErrorLog(
        "producthunt-errors.jsonl",
        { name: product.name, source_url: product.source_url },
        error,
      ),
  });

  console.log(JSON.stringify(stats, null, 2));
}

main().catch(async (error: unknown) => {
  await writeErrorLog("producthunt-errors.jsonl", { scope: "script" }, error);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
