import { useSearchParams } from "react-router-dom";
import PracticeSubmissionsWorkspace from "@/features/moderation/practice/PracticeSubmissionsWorkspace";

export default function AdminPracticeSubmissionsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  return (
    <PracticeSubmissionsWorkspace portal="admin" highlightId={highlightId} />
  );
}
