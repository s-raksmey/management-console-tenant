import { redirect } from "next/navigation";

export default function MyArticlesRedirect() {
  redirect("/articles?scope=my");
}
