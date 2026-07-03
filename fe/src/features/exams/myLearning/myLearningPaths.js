import { MY_LEARNING_HOME_PATH } from "@/utils/subjectPaths";

export { MY_LEARNING_HOME_PATH };

/** @param {"exams" | "practice"} [tab] */
export function getMyLearningPath(tab) {
  if (tab === "exams" || tab === "practice") {
    return `${MY_LEARNING_HOME_PATH}?activity=${tab}`;
  }
  return MY_LEARNING_HOME_PATH;
}
