import type { UIMessageStreamWriter } from "ai";
import type { Message } from "@/types";
// import { SystemContext } from "@/system-context";
// import { getNextAction } from "@/get-next-action";
// import { queryRewriter } from "./query-rewriter";
// import { searchSerper } from "@/serper";
// import { bulkCrawlWebsites } from "@/server/scraper";
// import { answerQuestion } from "@/answer-question";
// import { summarizeURL } from "./summarize-url";
import {
  checkIfQuestionNeedsClarification,
  generateClarificationRequest,
} from "./text-generators";
import { messagesToString } from "./utils";

export const runAgentLoop = async (
  messages: Message[],
  write: UIMessageStreamWriter<Message>["write"]
  // userLocation?: {
  //   latitude?: string;
  //   longitude?: string;
  //   city?: string;
  //   country?: string;
  // };
  // langfuseTraceId?: string;
) => {
  const messageHistory = messagesToString(messages);
  // // A persistent container for the state of our system
  // const ctx = new SystemContext(messages, opts.userLocation);

  // Step 0: Check if the question needs clarification
  const { needsClarification, reason = "" } =
    await checkIfQuestionNeedsClarification(messageHistory);

  if (needsClarification) {
    // Emit CLARIFICATION_REQUEST annotation
    write({
      type: "data-clarification-request",
      data: { reason },
    });

    // Return clarification request
    return generateClarificationRequest(messageHistory, reason);
  }

  throw new Error("Expected to have a clarification request");

  // let publicStep = 0;
  // // A loop that continues until we have an answer
  // // or we've taken 10 actions
  // while (!ctx.shouldStop()) {
  //   publicStep++;
  //   // Step 1: Plan and generate queries
  //   const { plan, queries } = await queryRewriter(ctx, opts);

  //   // Step 2: Run all queries in parallel and collect search results
  //   const allSearchResults = await Promise.all(
  //     queries.map(async (query) => {
  //       const results = await searchSerper({ q: query, num: 3 }, undefined);
  //       return { query, results: results.organic };
  //     })
  //   );

  //   // Deduplicate sources by URL
  //   const uniqueSources = Array.from(
  //     new Map(
  //       allSearchResults
  //         .flatMap(({ results }) => results)
  //         .map(({ link, title, snippet }) => [
  //           link,
  //           {
  //             title,
  //             url: link,
  //             snippet,
  //             favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${
  //               new URL(link).hostname
  //             }`,
  //           },
  //         ])
  //     ).values()
  //   );

  //   // Emit SOURCES annotation (one per step, before scraping/summarizing)
  //   if (opts.writeMessagePart) {
  //     opts.writeMessagePart({
  //       type: "data-sources",
  //       data: uniqueSources,
  //     });
  //   }

  //   const processPromises = allSearchResults.map(async ({ query, results }) => {
  //     const searchResultUrls = results.map(({ link }) => link);

  //     const crawlResults = await bulkCrawlWebsites({ urls: searchResultUrls });

  //     const summaries = await Promise.all(
  //       results.map(async (result) => {
  //         const crawlData = (await crawlResults.success)
  //           ? crawlResults.results.find(({ url }) => url === result.link)
  //           : undefined;

  //         const scrapedContent = crawlData?.result.success
  //           ? crawlData.result.data
  //           : "Failed to scrape";

  //         if (scrapedContent === "Failed to scrape") {
  //           return {
  //             ...result,
  //             summary: "Failed to scrape, so no summary available",
  //           };
  //         }

  //         const summary = await summarizeURL({
  //           conversation: ctx.getMessageHistory(),
  //           scrapedContent,
  //           searchMetadata: {
  //             date: result.date || new Date().toISOString(),
  //             title: result.title,
  //             url: result.link,
  //           },
  //           query,
  //           langfuseTraceId: opts.langfuseTraceId,
  //           systemContext: ctx,
  //         });

  //         return {
  //           ...result,
  //           summary,
  //         };
  //       })
  //     );

  //     // Update context with all search results (now with summaries)
  //     ctx.reportSearch({
  //       query,
  //       results: summaries.map(
  //         ({
  //           date = new Date().toISOString(),
  //           title,
  //           link,
  //           snippet,
  //           summary,
  //         }) => ({
  //           date,
  //           title,
  //           url: link,
  //           snippet,
  //           summary,
  //         })
  //       ),
  //     });
  //   });

  //   // Step 3: Decide next action
  //   const nextAction = await getNextAction(ctx, opts);
  //   if (nextAction.feedback) {
  //     ctx.setLatestFeedback(nextAction.feedback);
  //   }

  //   // Send the action as an annotation if writeMessageAnnotation is provided
  //   if (opts.writeMessagePart) {
  //     opts.writeMessagePart({
  //       type: "data-new-action",
  //       data: nextAction,
  //     });
  //   }

  //   // We execute the action and update the state of our system
  //   if (nextAction.type === "answer") {
  //     const result = answerQuestion(ctx, { isFinal: false, ...opts });

  //     // Send token usage annotation before the message is persisted
  //     if (opts.writeMessagePart) {
  //       const totalUsage = ctx.getTotalUsage();
  //       opts.writeMessagePart({
  //         type: "data-usage",
  //         data: { totalTokens: totalUsage.totalTokens },
  //       });
  //     }

  //     return result;
  //   }

  //   // We increment the step counter
  //   ctx.incrementStep();
  // }

  // // If we've taken 10 actions and haven't answered yet,
  // // we ask the LLM to give its best attempt at an answer
  // const result = answerQuestion(ctx, { isFinal: true, ...opts });

  // // Send token usage annotation before the message is persisted
  // if (opts.writeMessagePart) {
  //   const totalUsage = ctx.getTotalUsage();
  //   opts.writeMessagePart({
  //     type: "data-usage",
  //     data: { totalTokens: totalUsage.totalTokens },
  //   });
  // }

  // return result;
};
