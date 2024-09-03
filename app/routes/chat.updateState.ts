import { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const counterState = formData.get("counterState");

  console.log("Received counter state:", counterState);

  return new Response("State updated", { status: 200 });
};
