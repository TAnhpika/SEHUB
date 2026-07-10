/**
 * @fileoverview Cấu hình root app và toàn bộ cây route của SEHUB FE.
 *
 * Module này tập trung:
 * - Bọc các provider nền (`ThemeProvider`, `AuthProvider`, toast, confirm dialog).
 * - Khai báo lazy routes cho khu vực guest, authenticated, Premium, Admin và Moderator.
 * - Áp các route guard như `PrivateRoute`, `PremiumRoute`, `AdminRoute`, `ModeratorRoute`.
 *
 * @module app/App
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/common/Toast/ToastProvider";
import { ConfirmDialogProvider } from "@/hooks/useConfirmDialog";
import PrivateRoute from "@/common/guards/PrivateRoute";
import GuestRoute from "@/common/guards/GuestRoute";
import AuthenticatedHomeRedirect from "@/common/guards/AuthenticatedHomeRedirect";
import AuthLayout from "@/common/Layout/AuthLayout/AuthLayout";
import CommunityLayout from "@/common/Layout/CommunityLayout/CommunityLayout";
import GuestLayout from "@/common/Layout/GuestLayout/GuestLayout";
import MainLayout from "@/common/Layout/MainLayout/MainLayout";
import ExamFocusLayout from "@/common/Layout/ExamFocusLayout/ExamFocusLayout";
import { AuthProvider } from "@/context";
import { ThemeProvider } from "@/context/ThemeProvider";
import LoginPage from "@/features/auth/LoginPage/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage/RegisterPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage/ForgotPasswordPage";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage/VerifyEmailPage";
import FeedPage from "@/features/feed/FeedPage/FeedPage";
import HomePage from "@/features/home/HomePage/HomePage";
import LandingPage from "@/features/landing/LandingPage/LandingPage";
import NotFound from "@/features/errors/NotFound/NotFound";
import PremiumRoute from "@/common/guards/PremiumRoute";
import PracticeFocusRedirect from "@/common/routes/PracticeFocusRedirect";
import ExamFocusResultRedirect from "@/common/routes/ExamFocusResultRedirect";
import PracticalExamRedirect from "@/common/routes/PracticalExamRedirect";
import PracticeExamLegacyRedirect from "@/features/exams/PracticeExamLegacyRedirect/PracticeExamLegacyRedirect";
import ScrollToTop from "@/common/routes/ScrollToTop";
import AuthBootstrapFallback from "@/common/loading/AuthBootstrapFallback";
import AdminRoute from "@/common/guards/AdminRoute";
import ModeratorRoute from "@/common/guards/ModeratorRoute";
import AdminLayout from "@/common/Layout/AdminLayout/AdminLayout";
import ModeratorLayout from "@/common/Layout/ModeratorLayout/ModeratorLayout";

const AdminDashboardPage = lazy(() => import("@/features/admin/dashboard/AdminDashboardPage"));
const AdminUserListPage = lazy(() => import("@/features/admin/users/AdminUserListPage"));
const AdminUserDetailPage = lazy(() => import("@/features/admin/users/AdminUserDetailPage"));
const AdminExamListPage = lazy(() => import("@/features/admin/exams/AdminExamListPage"));
const AdminExamNewPage = lazy(() => import("@/features/admin/exams/AdminExamNewPage"));
const AdminAddFinalExamWizard = lazy(() => import("@/features/admin/exams/AdminAddFinalExamWizard"));
const AdminAddPracticeExamPage = lazy(() => import("@/features/admin/exams/AdminAddPracticeExamPage"));
const AdminExamFormPage = lazy(() => import("@/features/admin/exams/AdminExamFormPage"));
const AdminExamPendingPage = lazy(() => import("@/features/admin/exams/AdminExamPendingPage"));
const AdminExamDetailPage = lazy(() => import("@/features/admin/exams/AdminExamDetailPage"));
const AdminPracticeSubmissionsPage = lazy(() => import("@/features/admin/exams/AdminPracticeSubmissionsPage"));
const AdminDocumentCatalogPage = lazy(() => import("@/features/admin/documents/AdminDocumentCatalogPage"));
const AdminDocumentSubjectPage = lazy(() => import("@/features/admin/documents/AdminDocumentSubjectPage"));
const AdminModerationPage = lazy(() => import("@/features/admin/moderation/AdminModerationPage"));
const AdminContentModerationPage = lazy(() => import("@/features/admin/moderation/AdminContentModerationPage"));
const AdminReportDetailPage = lazy(() => import("@/features/admin/moderation/AdminReportDetailPage"));
const AdminBannedPage = lazy(() => import("@/features/admin/moderation/AdminBannedPage"));
const AdminPaymentListPage = lazy(() => import("@/features/admin/payments/AdminPaymentListPage"));
const AdminPaymentDetailPage = lazy(() => import("@/features/admin/payments/AdminPaymentDetailPage"));
const AdminVoucherPage = lazy(() => import("@/features/admin/vouchers/AdminVoucherPage"));
const AdminGamificationConfigPage = lazy(() => import("@/features/admin/gamification/AdminGamificationConfigPage"));
const AdminChatbotPage = lazy(() => import("@/features/admin/chatbot/AdminChatbotPage"));
const AdminPermissionsPage = lazy(() => import("@/features/admin/permissions/AdminPermissionsPage"));
const AdminActivityLogPage = lazy(() => import("@/features/admin/activity/AdminActivityLogPage"));
const AdminFeedbackPage = lazy(() => import("@/features/admin/feedback/AdminFeedbackPage"));

const AddPracticeExamPage = lazy(() => import("@/features/moderator/practiceExams/AddPracticeExamPage/AddPracticeExamPage"));
const ModeratorExamContributionHistoryPage = lazy(() => import("@/features/moderator/exams/ModeratorExamContributionHistoryPage/ModeratorExamContributionHistoryPage"));
const ModeratorPracticeSubmissionsPage = lazy(() => import("@/features/moderator/practiceExams/ModeratorPracticeSubmissionsPage"));
const AddFinalExamWizard = lazy(() => import("@/features/moderator/finalExams/AddFinalExamWizard"));
const FinalExamInfoStep = lazy(() => import("@/features/moderator/finalExams/steps/FinalExamInfoStep"));
const FinalExamQuestionsStep = lazy(() => import("@/features/moderator/finalExams/steps/FinalExamQuestionsStep"));
const FinalExamReviewStep = lazy(() => import("@/features/moderator/finalExams/steps/FinalExamReviewStep"));
const ViolatingAccountsPage = lazy(() => import("@/features/moderator/violations/ViolatingAccountsPage/ViolatingAccountsPage"));
const ContentModerationPage = lazy(() => import("@/features/moderator/content/ContentModerationPage/ContentModerationPage"));
const ContentModerationHistoryPage = lazy(() => import("@/features/moderator/content/ContentModerationHistoryPage/ContentModerationHistoryPage"));
const FeaturedPostsPage = lazy(() => import("@/features/moderator/featured/FeaturedPostsPage/FeaturedPostsPage"));
const ReportsPage = lazy(() => import("@/features/moderator/reports/ReportsPage/ReportsPage"));

const DocumentsPage = lazy(() => import("@/features/documents/DocumentsPage/DocumentsPage"));
const FriendProfilePage = lazy(() => import("@/features/home/FriendProfilePage/FriendProfilePage"));
const FriendsPage = lazy(() => import("@/features/home/FriendsPage/FriendsPage"));
const SearchAllPage = lazy(() => import("@/features/search/SearchAllPage/SearchAllPage"));
const CreatePostPage = lazy(() => import("@/features/posts/CreatePostPage/CreatePostPage"));
const PostDetailPage = lazy(() => import("@/features/feed/PostDetailPage/PostDetailPage"));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage/ProfilePage"));
const PracticeQuestionsPage = lazy(() => import("@/features/practice/PracticeQuestionsPage/PracticeQuestionsPage"));
const ReviewQuestionsPage = lazy(() => import("@/features/review/ReviewQuestionsPage/ReviewQuestionsPage"));
const SubjectDetailPage = lazy(() => import("@/features/subjects/SubjectDetailPage/SubjectDetailPage"));
const ExamDetailPage = lazy(() => import("@/features/exams/ExamDetailPage/ExamDetailPage"));
const ExamDoPage = lazy(() => import("@/features/exams/ExamDoPage/ExamDoPage"));
const PracticeDoPage = lazy(() => import("@/features/exams/PracticeDoPage/PracticeDoPage"));
const ExamResultPage = lazy(() => import("@/features/exams/ExamResultPage/ExamResultPage"));
const MyLearningPage = lazy(() => import("@/features/exams/myLearning/MyLearningPage"));
const FeedbackPage = lazy(() => import("@/features/feedback/FeedbackPage/FeedbackPage"));
const MessagesPage = lazy(() => import("@/features/chat/MessagesPage/MessagesPage"));
const EditProfilePage = lazy(() => import("@/features/profile/EditProfilePage/EditProfilePage"));
const PremiumPage = lazy(() => import("@/features/premium/PremiumPage/PremiumPage"));
const CheckoutPage = lazy(() => import("@/features/premium/CheckoutPage/CheckoutPage"));
const PaymentSuccessPage = lazy(() => import("@/features/premium/PaymentSuccessPage/PaymentSuccessPage"));
const PaymentReturnPage = lazy(() => import("@/features/premium/PaymentReturnPage/PaymentReturnPage"));
const PremiumRefundFormPage = lazy(() => import("@/features/premium/PremiumRefundFormPage/PremiumRefundFormPage"));
const SupportPage = lazy(() => import("@/features/support/SupportPage/SupportPage"));
const ChatbotAdvisorPage = lazy(() => import("@/features/chatbot/ChatbotAdvisorPage/ChatbotAdvisorPage"));

/**
 * Fallback dùng trong lúc lazy route đang tải hoặc auth bootstrap chưa sẵn sàng.
 *
 * @returns {import('react').ReactElement} Skeleton/fallback cho toàn route tree.
 */
function RouteFallback() {
  return <AuthBootstrapFallback />;
}

/**
 * Component gốc của ứng dụng web SEHUB.
 *
 * Cây route được phân tầng như sau:
 * - Guest/public: landing, support, login/register/forgot-password.
 * - Community/public-like: đọc feed, đề, tài liệu; một số thao tác làm bài bị chặn bởi `PremiumRoute`.
 * - Authenticated `/home`: workspace chính của user sau đăng nhập.
 * - Premium-only: AI Advisor, My Learning, focus exam flows.
 * - Admin/Moderator: khu vực quản trị và kiểm duyệt riêng.
 *
 * @returns {import('react').ReactElement} Root app với router và toàn bộ provider nền.
 *
 * @example
 * import { createRoot } from "react-dom/client";
 * createRoot(document.getElementById("root")).render(<App />);
 */
function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/community/pratical-exam/*" element={<PracticalExamRedirect />} />
            <Route path="/home/pratical-exam/*" element={<PracticalExamRedirect />} />
            <Route path="/exam/focus/pratical-exam/*" element={<PracticalExamRedirect />} />
            <Route element={<AuthenticatedHomeRedirect />}>
              <Route element={<GuestLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/support" element={<SupportPage />} />
              </Route>
              <Route path="/community" element={<CommunityLayout />}>
                <Route index element={<FeedPage />} />
                <Route path="final-exam" element={<ReviewQuestionsPage />} />
                <Route
                  path="final-exam/:courseCode"
                  element={<SubjectDetailPage page="review" />}
                />
                <Route
                  path="final-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="review" />}
                />
                <Route
                  path="final-exam/:courseCode/:examId/result"
                  element={<ExamResultPage page="review" />}
                />
                <Route path="practical-exam" element={<PracticeQuestionsPage />} />
                <Route
                  path="practical-exam/:courseCode"
                  element={<SubjectDetailPage page="practice" />}
                />
                <Route
                  path="practical-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="practice" />}
                />
                <Route element={<PremiumRoute />}>
                  <Route
                    path="practical-exam/:courseCode/:examId/do/:questionIndex"
                    element={<PracticeDoPage />}
                  />
                  <Route
                    path="practical-exam/:courseCode/:examId/result/:questionIndex"
                    element={<ExamResultPage page="practice" />}
                  />
                </Route>
                <Route path="documents" element={<DocumentsPage />} />
                <Route
                  path="documents/:courseCode"
                  element={<SubjectDetailPage page="documents" />}
                />
                <Route
                  path="documents/:courseCode/:examId"
                  element={<ExamDetailPage page="documents" />}
                />
              </Route>
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Route>
            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
            </Route>
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/home/search" element={<SearchAllPage />} />
                <Route path="/home/create-post" element={<CreatePostPage />} />
                <Route path="/home/posts/:postId" element={<PostDetailPage />} />
                <Route path="/home/feedback" element={<FeedbackPage />} />
                <Route path="/home/messages" element={<MessagesPage />} />
                <Route path="/home/premium" element={<PremiumPage />} />
                <Route path="/home/premium/checkout/:planId" element={<CheckoutPage />} />
                <Route path="/home/premium/payment-return" element={<PaymentReturnPage />} />
                <Route path="/home/premium/success/:planId" element={<PaymentSuccessPage />} />
                <Route path="/home/premium/refund-form" element={<PremiumRefundFormPage />} />
                <Route path="/home/friends" element={<FriendsPage />} />
                <Route path="/home/friends/:username" element={<FriendProfilePage />} />
                <Route path="/home/final-exam" element={<ReviewQuestionsPage scope="home" />} />
                <Route
                  path="/home/final-exam/:courseCode"
                  element={<SubjectDetailPage page="review" />}
                />
                <Route
                  path="/home/final-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="review" />}
                />
                <Route
                  path="/home/final-exam/:courseCode/:examId/result"
                  element={<ExamResultPage page="review" />}
                />
                <Route path="/home/practical-exam" element={<PracticeQuestionsPage scope="home" />} />
                <Route
                  path="/home/practical-exam/:courseCode"
                  element={<SubjectDetailPage page="practice" />}
                />
                <Route
                  path="/home/practical-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="practice" />}
                />
                <Route element={<PremiumRoute />}>
                  <Route
                    path="/home/practical-exam/:courseCode/:examId/do/:questionIndex"
                    element={<PracticeDoPage />}
                  />
                  <Route
                    path="/home/practical-exam/:courseCode/:examId/result/:questionIndex"
                    element={<ExamResultPage page="practice" />}
                  />
                </Route>
                <Route path="/home/documents" element={<DocumentsPage scope="home" />} />
                <Route
                  path="/home/documents/:courseCode"
                  element={<SubjectDetailPage page="documents" />}
                />
                <Route
                  path="/home/documents/:courseCode/:examId"
                  element={<ExamDetailPage page="documents" />}
                />
                <Route path="/profile/:username/edit" element={<EditProfilePage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route element={<PremiumRoute />}>
                  <Route path="/home/advisor" element={<ChatbotAdvisorPage />} />
                  <Route path="/home/my-learning" element={<MyLearningPage />} />
                </Route>
              </Route>
              <Route element={<PremiumRoute />}>
                <Route element={<ExamFocusLayout />}>
                  <Route
                    path="/exam/focus/final-exam/:courseCode/:examId/do"
                    element={<ExamDoPage page="review" />}
                  />
                </Route>
                <Route
                  path="/exam/focus/final-exam/:courseCode/:examId/result"
                  element={<ExamFocusResultRedirect />}
                />
              </Route>
              <Route element={<PremiumRoute />}>
                <Route
                  path="/exam/focus/practical-exam/:courseCode/:examId/do/:questionIndex"
                  element={<PracticeFocusRedirect />}
                />
                <Route
                  path="/exam/focus/practical-exam/:courseCode/:examId/result/:questionIndex"
                  element={<PracticeFocusRedirect result />}
                />
              </Route>
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUserListPage />} />
                <Route path="users/:id" element={<AdminUserDetailPage />} />
                <Route path="exams" element={<AdminExamListPage />} />
                <Route path="exams/new" element={<AdminExamNewPage />} />
                <Route path="exams/new/final/*" element={<AdminAddFinalExamWizard />} />
                <Route path="exams/final/edit/:examId/*" element={<AdminAddFinalExamWizard />} />
                <Route path="exams/new/practice" element={<AdminAddPracticeExamPage />} />
                <Route path="exams/pending" element={<AdminExamPendingPage />} />
                <Route
                  path="exams/submissions"
                  element={<Navigate to="/admin/moderation/practice-submissions" replace />}
                />
                <Route path="exams/:id/edit" element={<AdminExamFormPage />} />
                <Route path="exams/:id" element={<AdminExamDetailPage />} />
                <Route path="documents" element={<AdminDocumentCatalogPage />} />
                <Route path="documents/:courseCode" element={<AdminDocumentSubjectPage />} />
                <Route path="moderation/content" element={<AdminContentModerationPage />} />
                <Route
                  path="moderation/practice-submissions"
                  element={<AdminPracticeSubmissionsPage />}
                />
                <Route path="moderation/banned" element={<AdminBannedPage />} />
                <Route path="moderation/:id" element={<AdminReportDetailPage />} />
                <Route path="moderation" element={<AdminModerationPage />} />
                <Route path="payments" element={<AdminPaymentListPage />} />
                <Route path="payments/:id" element={<AdminPaymentDetailPage />} />
                <Route path="vouchers" element={<AdminVoucherPage />} />
                <Route path="gamification" element={<AdminGamificationConfigPage />} />
                <Route path="settings/chatbot" element={<AdminChatbotPage />} />
                <Route path="permissions" element={<AdminPermissionsPage />} />
                <Route path="activity" element={<AdminActivityLogPage />} />
                <Route path="feedback" element={<AdminFeedbackPage />} />
              </Route>
            </Route>
            <Route element={<ModeratorRoute />}>
              <Route path="/moderator" element={<ModeratorLayout />}>
                <Route index element={<Navigate to="/moderator/reports" replace />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="content" element={<ContentModerationPage />} />
                <Route path="content/history" element={<ContentModerationHistoryPage />} />
                <Route path="featured" element={<FeaturedPostsPage />} />
                <Route path="violations" element={<ViolatingAccountsPage />} />
                <Route path="practice-submissions" element={<ModeratorPracticeSubmissionsPage />} />
                <Route path="exams/history" element={<ModeratorExamContributionHistoryPage />} />
                <Route path="practice-exams/add" element={<AddPracticeExamPage />} />
                <Route path="practice-exams/edit/:examId" element={<AddPracticeExamPage />} />
                <Route path="final-exams/add" element={<AddFinalExamWizard />}>
                  <Route index element={<FinalExamInfoStep />} />
                  <Route path="questions" element={<FinalExamQuestionsStep />} />
                  <Route path="review" element={<FinalExamReviewStep />} />
                </Route>
                <Route path="final-exams/edit/:examId" element={<AddFinalExamWizard />}>
                  <Route index element={<FinalExamInfoStep />} />
                  <Route path="questions" element={<FinalExamQuestionsStep />} />
                  <Route path="review" element={<FinalExamReviewStep />} />
                </Route>
              </Route>
            </Route>
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/exams/:examId/practice" element={<PracticeExamLegacyRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </ConfirmDialogProvider>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
