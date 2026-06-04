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
import ModeratorRoute from "@/common/guards/ModeratorRoute";
import ModeratorLayout from "@/common/Layout/ModeratorLayout/ModeratorLayout";
import AddPracticeExamPage from "@/features/moderator/practiceExams/AddPracticeExamPage/AddPracticeExamPage";
import AddFinalExamWizard from "@/features/moderator/finalExams/AddFinalExamWizard";
import FinalExamInfoStep from "@/features/moderator/finalExams/steps/FinalExamInfoStep";
import FinalExamQuestionsStep from "@/features/moderator/finalExams/steps/FinalExamQuestionsStep";
import FinalExamReviewStep from "@/features/moderator/finalExams/steps/FinalExamReviewStep";
import ViolatingAccountsPage from "@/features/moderator/violations/ViolatingAccountsPage/ViolatingAccountsPage";
import ContentModerationPage from "@/features/moderator/content/ContentModerationPage/ContentModerationPage";

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
            <Route element={<ModeratorRoute />}>
              <Route path="/moderator" element={<ModeratorLayout />}>
                <Route index element={<Navigate to="/moderator/final-exams/add" replace />} />
                <Route path="practice-exams/add" element={<AddPracticeExamPage />} />
                <Route path="violations" element={<ViolatingAccountsPage />} />
                <Route path="content" element={<ContentModerationPage />} />
                <Route path="final-exams/add" element={<AddFinalExamWizard />}>
                  <Route index element={<FinalExamInfoStep />} />
                  <Route path="questions" element={<FinalExamQuestionsStep />} />
                  <Route path="review" element={<FinalExamReviewStep />} />
                </Route>
              </Route>
            </Route>
            <Route path="/landing" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
