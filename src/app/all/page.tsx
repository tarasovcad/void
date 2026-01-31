import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import AllItemsClient from "./AllItemsClient";
import type {AllItem} from "./AllItemsClient";

const DEMO_ITEMS: AllItem[] = [
  {
    id: "1",
    kind: "website",
    title: "Linear – Plan and build products",
    domain: "linear.app",
    dateLabel: "Jan 14, 2026",
    tags: ["design", "ui", "components"],
  },
  {
    id: "2",
    kind: "article",
    title: "Building Beautiful UI Components with React",
    domain: "medium.com",
    dateLabel: "Jan 11, 2026",
    tags: ["react", "components", "ui"],
  },
  {
    id: "3",
    kind: "video",
    title: "Advanced CSS Animations Tutorial",
    domain: "youtube.com",
    dateLabel: "Jan 9, 2026",
    tags: ["animation", "design", "videos"],
  },
  {
    id: "4",
    kind: "image",
    title: "Dashboard Design Mockup",
    domain: "dribbble.com",
    dateLabel: "Jan 7, 2026",
    tags: ["design", "ui"],
  },
  {
    id: "5",
    kind: "website",
    title: "Vercel – Develop. Preview. Ship.",
    domain: "vercel.com",
    dateLabel: "Jan 6, 2026",
    tags: [],
  },
  {
    id: "6",
    kind: "article",
    title: "The Art of Minimalist Web Design",
    domain: "a16z.com",
    dateLabel: "Jan 6, 2026",
    tags: [],
  },
  {
    id: "7",
    kind: "social",
    title: "Thread on Design Systems",
    domain: "x.com",
    dateLabel: "Jan 5, 2026",
    tags: [],
  },
  {
    id: "8",
    kind: "video",
    title: "React Server Components Explained",
    domain: "youtube.com",
    dateLabel: "Jan 4, 2026",
    tags: [],
  },
  {
    id: "9",
    kind: "video",
    title: "React Server Components Explained",
    domain: "youtube.com",
    dateLabel: "Jan 4, 2026",
    tags: [],
  },
];

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <AppShell session={data}>
      <AllItemsClient items={DEMO_ITEMS} />
    </AppShell>
  );
};

export default page;
