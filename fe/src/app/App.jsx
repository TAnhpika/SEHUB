import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/common/Toast/ToastProvider";
import PrivateRoute from "@/common/guards/PrivateRoute";
import CommunityLayout from "@/common/Layout/CommunityLayout/CommunityLayout";
import GuestLayout from "@/common/Layout/GuestLayout/GuestLayout";
import MainLayout from "@/common/Layout/MainLayout/MainLayout";
import { AuthProvider } from "@/context/AuthContext";
import AuthPlaceholder from "@/features/auth/AuthPlaceholder";
import LoginPage from "@/features/auth/LoginPage/LoginPage";
import DocumentsPage from "@/features/documents/DocumentsPage/DocumentsPage";
import FeedPage from "@/features/feed/FeedPage/FeedPage";
import FriendProfilePage from "@/features/home/FriendProfilePage/FriendProfilePage";
import FriendsPage from "@/features/home/FriendsPage/FriendsPage";
import HomePage from "@/features/home/HomePage/HomePage";
import LandingPage from "@/features/landing/LandingPage/LandingPage";
import ProfilePage from "@/features/profile/ProfilePage/ProfilePage";
import PracticeQuestionsPage from "@/features/practice/PracticeQuestionsPage/PracticeQuestionsPage";
import ReviewQuestionsPage from "@/features/review/ReviewQuestionsPage/ReviewQuestionsPage";
import SubjectDetailPage from "@/features/subjects/SubjectDetailPage/SubjectDetailPage";
import SupportPage from "@/features/support/SupportPage/SupportPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/register" element={<AuthPlaceholder />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/home/friends" element={<FriendsPage />} />
                <Route path="/home/friends/:username" element={<FriendProfilePage />} />
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
              <Route path="pratical-exam" element={<PracticeQuestionsPage />} />
              <Route
                path="pratical-exam/:courseCode"
                element={<SubjectDetailPage page="practice" />}
              />
              <Route path="documents" element={<DocumentsPage />} />
              <Route
                path="documents/:courseCode"
                element={<SubjectDetailPage page="documents" />}
              />
            </Route>
            <Route path="/landing" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
