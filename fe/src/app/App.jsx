import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/common/Toast/ToastProvider";
import PrivateRoute from "@/common/guards/PrivateRoute";
import AuthLayout from "@/common/Layout/AuthLayout/AuthLayout";
import CommunityLayout from "@/common/Layout/CommunityLayout/CommunityLayout";
import GuestLayout from "@/common/Layout/GuestLayout/GuestLayout";
import MainLayout from "@/common/Layout/MainLayout/MainLayout";
import { AuthProvider } from "@/context";
import LoginPage from "@/features/auth/LoginPage/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage/RegisterPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage/ForgotPasswordPage";
import DocumentsPage from "@/features/documents/DocumentsPage/DocumentsPage";
import FeedPage from "@/features/feed/FeedPage/FeedPage";
import FriendProfilePage from "@/features/home/FriendProfilePage/FriendProfilePage";
import FriendsPage from "@/features/home/FriendsPage/FriendsPage";
import HomePage from "@/features/home/HomePage/HomePage";
import LandingPage from "@/features/landing/LandingPage/LandingPage";
import CreatePostPage from "@/features/posts/CreatePostPage/CreatePostPage";
import PostDetailPage from "@/features/feed/PostDetailPage/PostDetailPage";
import ProfilePage from "@/features/profile/ProfilePage/ProfilePage";
import PracticeQuestionsPage from "@/features/practice/PracticeQuestionsPage/PracticeQuestionsPage";
import ReviewQuestionsPage from "@/features/review/ReviewQuestionsPage/ReviewQuestionsPage";
import SubjectDetailPage from "@/features/subjects/SubjectDetailPage/SubjectDetailPage";
import ExamDetailPage from "@/features/exams/ExamDetailPage/ExamDetailPage";
import FeedbackPage from "@/features/feedback/FeedbackPage/FeedbackPage";
import MessagesPage from "@/features/chat/MessagesPage/MessagesPage";
import EditProfilePage from "@/features/profile/EditProfilePage/EditProfilePage";
import PremiumPage from "@/features/premium/PremiumPage/PremiumPage";
import CheckoutPage from "@/features/premium/CheckoutPage/CheckoutPage";
import PaymentSuccessPage from "@/features/premium/PaymentSuccessPage/PaymentSuccessPage";
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
import AdminGamificationConfigPage from "@/features/admin/gamification/AdminGamificationConfigPage";
import AdminPermissionsPage from "@/features/admin/permissions/AdminPermissionsPage";
import AdminActivityLogPage from "@/features/admin/activity/AdminActivityLogPage";
import AddPracticeExamPage from "@/features/moderator/practiceExams/AddPracticeExamPage/AddPracticeExamPage";
import ModeratorPracticeSubmissionsPage from "@/features/moderator/practiceExams/ModeratorPracticeSubmissionsPage";
import ModeratorReportsPage from "@/features/moderator/reports/ModeratorReportsPage";
import ModeratorContentPage from "@/features/moderator/content/ModeratorContentPage";
import ModeratorFeaturedPage from "@/features/moderator/featured/ModeratorFeaturedPage";
import ModeratorViolationsPage from "@/features/moderator/violations/ModeratorViolationsPage";
import AddFinalExamPage from "@/features/moderator/finalExams/AddFinalExamPage";
import NotFoundPage from "@/features/errors/NotFoundPage/NotFoundPage";

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
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/home/create-post" element={<CreatePostPage />} />
                <Route path="/home/posts/:postId" element={<PostDetailPage />} />
                <Route path="/home/feedback" element={<FeedbackPage />} />
                <Route path="/home/messages" element={<MessagesPage />} />
                <Route path="/home/premium" element={<PremiumPage />} />
                <Route path="/home/premium/checkout/:planId" element={<CheckoutPage />} />
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
                <Route path="/home/pratical-exam" element={<PracticeQuestionsPage scope="home" />} />
                <Route
                  path="/home/pratical-exam/:courseCode"
                  element={<SubjectDetailPage page="practice" />}
                />
                <Route
                  path="/home/pratical-exam/:courseCode/:examId"
                  element={<ExamDetailPage page="practice" />}
                />
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
              <Route path="pratical-exam" element={<PracticeQuestionsPage />} />
              <Route
                path="pratical-exam/:courseCode"
                element={<SubjectDetailPage page="practice" />}
              />
              <Route
                path="pratical-exam/:courseCode/:examId"
                element={<ExamDetailPage page="practice" />}
              />
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
                <Route
                  path="moderation/banned"
                  element={<Navigate to="/admin/users?status=banned" replace />}
                />
                <Route path="moderation/:id" element={<AdminReportDetailPage />} />
                <Route path="payments" element={<AdminPaymentListPage />} />
                <Route path="gamification" element={<AdminGamificationConfigPage />} />
                <Route path="permissions" element={<AdminPermissionsPage />} />
                <Route path="activity" element={<AdminActivityLogPage />} />
              </Route>
            </Route>
            <Route element={<ModeratorRoute />}>
              <Route path="/moderator" element={<ModeratorLayout />}>
                <Route index element={<Navigate to="/moderator/reports" replace />} />
                <Route path="reports" element={<ModeratorReportsPage />} />
                <Route path="content" element={<ModeratorContentPage />} />
                <Route path="featured" element={<ModeratorFeaturedPage />} />
                <Route path="violations" element={<ModeratorViolationsPage />} />
                <Route path="final-exams/add" element={<AddFinalExamPage />} />
                <Route path="practice-submissions" element={<ModeratorPracticeSubmissionsPage />} />
                <Route path="practice-exams/add" element={<AddPracticeExamPage />} />
              </Route>
            </Route>
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
