import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/common/Toast/ToastProvider";
import PrivateRoute from "@/common/guards/PrivateRoute";
import GuestRoute from "@/common/guards/GuestRoute";
import AuthLayout from "@/common/Layout/AuthLayout/AuthLayout";
import CommunityLayout from "@/common/Layout/CommunityLayout/CommunityLayout";
import GuestLayout from "@/common/Layout/GuestLayout/GuestLayout";
import MainLayout from "@/common/Layout/MainLayout/MainLayout";
import ExamFocusLayout from "@/common/Layout/ExamFocusLayout/ExamFocusLayout";
import { AuthProvider } from "@/context";
import LoginPage from "@/features/auth/LoginPage/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage/RegisterPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage/ForgotPasswordPage";
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
import SupportPage from "@/features/support/SupportPage/SupportPage";
import AdminRoute from "@/common/guards/AdminRoute";
import ModeratorRoute from "@/common/guards/ModeratorRoute";
import AdminLayout from "@/common/Layout/AdminLayout/AdminLayout";
import ModeratorLayout from "@/common/Layout/ModeratorLayout/ModeratorLayout";
import AdminDashboardPage from "@/features/admin/dashboard/AdminDashboardPage";
import AdminUserListPage from "@/features/admin/users/AdminUserListPage";
import AdminUserDetailPage from "@/features/admin/users/AdminUserDetailPage";
import AdminExamListPage from "@/features/admin/exams/AdminExamListPage";
import AdminExamFormPage from "@/features/admin/exams/AdminExamFormPage";
import AdminExamPendingPage from "@/features/admin/exams/AdminExamPendingPage";
import AdminExamDetailPage from "@/features/admin/exams/AdminExamDetailPage";
import AdminPracticeSubmissionsPage from "@/features/admin/exams/AdminPracticeSubmissionsPage";
import AdminDocumentCatalogPage from "@/features/admin/documents/AdminDocumentCatalogPage";
import AdminDocumentSubjectPage from "@/features/admin/documents/AdminDocumentSubjectPage";
import AdminModerationPage from "@/features/admin/moderation/AdminModerationPage";
import AdminReportDetailPage from "@/features/admin/moderation/AdminReportDetailPage";
import AdminBannedPage from "@/features/admin/moderation/AdminBannedPage";
import AdminPaymentListPage from "@/features/admin/payments/AdminPaymentListPage";
import AdminPaymentDetailPage from "@/features/admin/payments/AdminPaymentDetailPage";
import AdminVoucherPage from "@/features/admin/vouchers/AdminVoucherPage";
import AdminGamificationConfigPage from "@/features/admin/gamification/AdminGamificationConfigPage";
import AdminPermissionsPage from "@/features/admin/permissions/AdminPermissionsPage";
import AdminActivityLogPage from "@/features/admin/activity/AdminActivityLogPage";
import AddPracticeExamPage from "@/features/moderator/practiceExams/AddPracticeExamPage/AddPracticeExamPage";
import ModeratorExamContributionHistoryPage from "@/features/moderator/exams/ModeratorExamContributionHistoryPage/ModeratorExamContributionHistoryPage";
import ModeratorPracticeSubmissionsPage from "@/features/moderator/practiceExams/ModeratorPracticeSubmissionsPage";
import NotFound from "@/features/errors/NotFound/NotFound";
import AddFinalExamWizard from "@/features/moderator/finalExams/AddFinalExamWizard";
import FinalExamInfoStep from "@/features/moderator/finalExams/steps/FinalExamInfoStep";
import FinalExamQuestionsStep from "@/features/moderator/finalExams/steps/FinalExamQuestionsStep";
import FinalExamReviewStep from "@/features/moderator/finalExams/steps/FinalExamReviewStep";
import ViolatingAccountsPage from "@/features/moderator/violations/ViolatingAccountsPage/ViolatingAccountsPage";
import ContentModerationPage from "@/features/moderator/content/ContentModerationPage/ContentModerationPage";
import ContentModerationHistoryPage from "@/features/moderator/content/ContentModerationHistoryPage/ContentModerationHistoryPage";
import FeaturedPostsPage from "@/features/moderator/featured/FeaturedPostsPage/FeaturedPostsPage";
import ReportsPage from "@/features/moderator/reports/ReportsPage/ReportsPage";
import PracticeFocusRedirect from "@/common/routes/PracticeFocusRedirect";
import ExamFocusResultRedirect from "@/common/routes/ExamFocusResultRedirect";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/support" element={<SupportPage />} />
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
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
