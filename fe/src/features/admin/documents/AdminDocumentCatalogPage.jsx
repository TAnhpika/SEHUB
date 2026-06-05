import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { getAdminDocumentsSubjectUrl } from "@/features/admin/documents/adminDocumentPaths";
import {
  MAJOR_OPTIONS,
  REVIEW_COURSES,
  SEMESTER_OPTIONS,
} from "@/features/review/ReviewQuestionsPage/reviewData";
import catalogStyles from "@/features/subjects/CourseCatalogPage/CourseCatalogPage.module.css";
import docStyles from "@/features/admin/documents/AdminDocuments.module.css";

function AdminDocumentCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const semesterFromUrl = searchParams.get("semester");
  const [semesterFilter, setSemesterFilter] = useState(() =>
    semesterFromUrl && semesterFromUrl !== "all" ? semesterFromUrl : "all",
  );
  const [majorFilter, setMajorFilter] = useState("all");

  useEffect(() => {
    if (semesterFromUrl && semesterFromUrl !== "all") {
      setSemesterFilter(semesterFromUrl);
    }
  }, [semesterFromUrl]);

  function handleSemesterChange(value) {
    setSemesterFilter(value);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "all") next.delete("semester");
        else next.set("semester", value);
        return next;
      },
      { replace: true },
    );
  }

  const filteredSemesters = useMemo(() => {
    return REVIEW_COURSES.map((group) => ({
      ...group,
      courses: group.courses.filter(
        (course) => majorFilter === "all" || course.major === majorFilter,
      ),
    })).filter((group) => {
      const matchSemester =
        semesterFilter === "all" || String(group.semester) === semesterFilter;
      return matchSemester && group.courses.length > 0;
    });
  }, [semesterFilter, majorFilter]);

  return (
    <AdminPageLayout
      title="Quản lý tài liệu"
      subtitle="Bài giảng, sách giáo khoa và tài liệu tham khảo — chọn kỳ và môn để upload hoặc quản lý file."
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý tài liệu" }]}
    >
      <div className={docStyles.catalogWrap}>
        <div className={catalogStyles["filter-bar"]}>
          <label className={catalogStyles.filter}>
            <select
              value={semesterFilter}
              onChange={(e) => handleSemesterChange(e.target.value)}
              aria-label="Lọc theo học kỳ"
            >
              {SEMESTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className={catalogStyles["filter-icon"]} />
          </label>

          <label className={catalogStyles.filter}>
            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              aria-label="Lọc theo chuyên ngành"
            >
              {MAJOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className={catalogStyles["filter-icon"]} />
          </label>
        </div>

        <div className={catalogStyles.content}>
          {filteredSemesters.map((group) => (
            <section key={group.semester}>
              <h2 className={catalogStyles["semester-title"]}>Kỳ {group.semester}</h2>
              <ul className={catalogStyles.grid}>
                {group.courses.map((course, index) => (
                  <li key={`${group.semester}-${course.code}-${index}`}>
                    <Link
                      to={getAdminDocumentsSubjectUrl({
                        code: course.code,
                        semester: String(group.semester),
                      })}
                      className={catalogStyles.card}
                    >
                      <span className={catalogStyles.code}>{course.code}</span>
                      <span
                        className={`${catalogStyles.badge} ${
                          course.major === "AI"
                            ? catalogStyles["badge-ai"]
                            : catalogStyles["badge-se"]
                        }`}
                      >
                        {course.major}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {filteredSemesters.length === 0 ? (
            <p className={catalogStyles.empty}>Không có môn học phù hợp với bộ lọc.</p>
          ) : null}
        </div>
      </div>
    </AdminPageLayout>
  );
}

export default AdminDocumentCatalogPage;
