import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import React from "react";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <AppShell session={data}>
      <div className="flex h-full flex-col items-center justify-center"></div>
    </AppShell>
  );
};

export default page;
