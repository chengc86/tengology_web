"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SocialDrafts } from "./SocialDrafts";
import { SocialAccounts } from "./SocialAccounts";
import { SocialScheduleManager } from "./SocialScheduleManager";

interface Props {
  products: Array<{ id: string; title: string }>;
}

export function SocialDashboard({ products }: Props) {
  return (
    <Tabs defaultValue="drafts">
      <TabsList variant="line">
        <TabsTrigger value="drafts">Drafts</TabsTrigger>
        <TabsTrigger value="accounts">Accounts</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
      </TabsList>

      <TabsContent value="drafts" className="mt-6">
        <SocialDrafts products={products} />
      </TabsContent>

      <TabsContent value="accounts" className="mt-6">
        <SocialAccounts />
      </TabsContent>

      <TabsContent value="schedule" className="mt-6">
        <SocialScheduleManager />
      </TabsContent>
    </Tabs>
  );
}
