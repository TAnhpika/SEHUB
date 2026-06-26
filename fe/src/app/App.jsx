import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/common/Toast/ToastProvider";
import PrivateRoute from "@/common/guards/PrivateRoute";
import GuestRoute from "@/common/guards/GuestRoute";
import AuthenticatedHomeRedirect from "@/common/guards/AuthenticatedHomeRedirect";
import AuthLayout from "@/common/Layout/AuthLayout/AuthLayout";
import CommunityLayout from "@/common/Layout/CommunityLayout/CommunityLayout";
import GuestLayout from "@/common/Layout/GuestLayout/GuestLayout";
import MainLayout from "@/common/Layout/MainLayout/MainLayout";
import ExamFocusLayout from "@/common/Layout/ExamFocusLayout/ExamFocusLayout";
import { AuthProvider } from "@/context";
import LoginPage from "@/features/auth/LoginPage/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage/RegisterPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage/ForgotPasswordPage";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage/VerifyEmailPage";
import DocumentsPage from "@/features/documents/DocumentsPage/DocumentsPage";
import FeedPage from "@/features/feed/FeedPage/FeedPage";
import FriendProfilePage from "@/features/home/FriendProfilePage/FriendProfilePage";
import FriendsPage from "@/features/home/FriendsPage/FriendsPage";
import HomePage from "@/features/home/HomePage/HomePage";
import SearchAllPage from "@/features/search/SearchAllPage/SearchAllPage";
import LandingPage from "@/features/landing/LandingPage/LandingPage";
import CreatePostPage from "@/features/posts/CreatePostPage/CreatePostPage";
import PostDetailPage from "@/features/feed/PostDetailPage/PostDetailPage";
import ProfilePage from "@/features/profile/ProfilePage/ProfilePage";
import PracticeQuestionsPage from "@/features/practice/PracticeQuestionsPage/PracticeQuestionsPage";
import ReviewQuestionsPage from "@/features/review/ReviewQuestionsPage/ReviewQuestionsPage";
import SubjectDetailPage from "@/features/subjects/SubjectDetailPage/SubjectDetailPage";
import ExamDetailPage from "@/features/exams/ExamDetailPage/ExamDetailPage";
import ExamDoPage from "@/features/exams/ExamDoPage/ExamDoPage";
import PracticeDoPage from "@/features/exams/PracticeDoPage/PracticeDoPage";
import ExamResultPage from "@/features/exams/ExamResultPage/ExamResultPage";
import PremiumRoute from "@/common/guards/PremiumRoute";
import FeedbackPage from "@/features/feedback/FeedbackPage/FeedbackPage";
import MessagesPage from "@/features/chat/MessagesPage/MessagesPage";
import EditProfilePage from "@/features/profile/EditProfilePage/EditProfilePage";
import PremiumPage from "@/features/premium/PremiumPage/PremiumPage";
import CheckoutPage from "@/features/premium/CheckoutPage/CheckoutPage";
import PaymentSuccessPage from "@/features/premium/PaymentSuccessPage/PaymentSuccessPage";
import PaymentReturnPage from "@/features/premium/PaymentReturnPage/PaymentReturnPage";
import PremiumRefundFormPage from "@/features/premium/PremiumRefundFormPage/PremiumRefundFormPage";
import SupportPage from "@/features/support/SupportPage/SupportPage";
import ChatbotAdvisorPage from "@/features/chatbot/ChatbotAdvisorPage/ChatbotAdvisorPage";
import NotFound from "@/features/errors/NotFound/NotFound";
import PracticeFocusRedirect from "@/common/routes/PracticeFocusRedirect";
import ExamFocusResultRedirect from "@/common/routes/ExamFocusResultRedirect";
import ScrollToTop from "@/common/routes/ScrollToTop";
import AdminRoute from "@/common/guards/AdminRoute";
import ModeratorRoute from "@/common/guards/ModeratorRoute";
import AdminLayout from "@/common/Layout/AdminLayout/AdminLayout";
import ModeratorLayout from "@/common/Layout/ModeratorLayout/ModeratorLayout";

const AdminDashboardPage = lazy(() => import("@/features/admin/dashboard/AdminDashboardPage"));
const AdminUserListPage = lazy(() => import("@/features/admin/users/AdminUserListPage"));
const AdminUserDetailPage = lazy(() => import("@/features/admin/users/AdminUserDetailPage"));
const AdminExamListPage = lazy(() => import("@/features/admin/exams/AdminExamListPage"));
const AdminExamFormPage = lazy(() => import("@/features/admin/exams/AdminExamFormPage"));
const AdminExamPendingPage = lazy(() => import("@/features/admin/exams/AdminExamPendingPage"));
const AdminExamDetailPage = lazy(() => import("@/features/admin/exams/AdminExamDetailPage"));
const AdminPracticeSubmissionsPage = lazy(() => import("@/features/admin/exams/AdminPracticeSubmissionsPage"));
const AdminDocumentCatalogPage = lazy(() => import("@/features/admin/documents/AdminDocumentCatalogPage"));
const AdminDocumentSubjectPage = lazy(() => import("@/features/admin/documents/AdminDocumentSubjectPage"));
const AdminModerationPage = lazy(() => import("@/features/admin/moderation/AdminModerationPage"));
const AdminReportDetailPage = lazy(() => import("@/features/admin/moderation/AdminReportDetailPage"));
const AdminBannedPage = lazy(() => import("@/features/admin/moderation/AdminBannedPage"));
const AdminPaymentListPage = lazy(() => import("@/features/admin/payments/AdminPaymentListPage"));
const AdminPaymentDetailPage = lazy(() => import("@/features/admin/payments/AdminPaymentDetailPage"));
const AdminVoucherPage = lazy(() => import("@/features/admin/vouchers/AdminVoucherPage"));
const AdminGamificationConfigPage = lazy(() => import("@/features/admin/gamification/AdminGamificationConfigPage"));
const AdminChatbotPage = lazy(() => import("@/features/admin/chatbot/AdminChatbotPage"));
const AdminPermissionsPage = lazy(() => import("@/features/admin/permissions/AdminPermissionsPage"));
const AdminActivityLogPage = lazy(() => import("@/features/admin/activity/AdminActivityLogPage"));

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

function RouteFallback() {
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
      Đang tải…
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
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
                <Route path="pratical-exam" element={<PracticeQuestionsPage />} />
                <Route
                  path="pratical-exam/:courseCode"
                  element={<SubjectDetailPage page="practice" />}
                />
                <Route
                  path="pratical-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="practice" />}
                />
                <Route element={<PremiumRoute />}>
                  <Route
                    path="pratical-exam/:courseCode/:examId/do/:questionIndex"
                    element={<PracticeDoPage />}
                  />
                  <Route
                    path="pratical-exam/:courseCode/:examId/result/:questionIndex"
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
                <Route path="/home/pratical-exam" element={<PracticeQuestionsPage scope="home" />} />
                <Route
                  path="/home/pratical-exam/:courseCode"
                  element={<SubjectDetailPage page="practice" />}
                />
                <Route
                  path="/home/pratical-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="practice" />}
                />
                <Route element={<PremiumRoute />}>
                  <Route
                    path="/home/pratical-exam/:courseCode/:examId/do/:questionIndex"
                    element={<PracticeDoPage />}
                  />
                  <Route
                    path="/home/pratical-exam/:courseCode/:examId/result/:questionIndex"
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
                  path="/exam/focus/pratical-exam/:courseCode/:examId/do/:questionIndex"
                  element={<PracticeFocusRedirect />}
                />
                <Route
                  path="/exam/focus/pratical-exam/:courseCode/:examId/result/:questionIndex"
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
                <Route path="exams/new" element={<AdminExamFormPage />} />
                <Route path="exams/pending" element={<AdminExamPendingPage />} />
                <Route path="exams/submissions" element={<AdminPracticeSubmissionsPage />} />
                <Route path="exams/:id/edit" element={<AdminExamFormPage />} />
                <Route path="exams/:id" element={<AdminExamDetailPage />} />
                <Route path="documents" element={<AdminDocumentCatalogPage />} />
                <Route path="documents/:courseCode" element={<AdminDocumentSubjectPage />} />
                <Route path="moderation" element={<AdminModerationPage />} />
                <Route path="moderation/banned" element={<AdminBannedPage />} />
                <Route path="moderation/:id" element={<AdminReportDetailPage />} />
                <Route path="payments" element={<AdminPaymentListPage />} />
                <Route path="payments/:id" element={<AdminPaymentDetailPage />} />
                <Route path="vouchers" element={<AdminVoucherPage />} />
                <Route path="gamification" element={<AdminGamificationConfigPage />} />
                <Route path="settings/chatbot" element={<AdminChatbotPage />} />
                <Route path="permissions" element={<AdminPermissionsPage />} />
                <Route path="activity" element={<AdminActivityLogPage />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
