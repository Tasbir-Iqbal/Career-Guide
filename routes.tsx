import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { GuestHome } from "./pages/GuestHome";
import { StudentDashboard } from "./pages/StudentDashboard";
import { CounselorDashboard } from "./pages/CounselorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ArticlesPage } from "./pages/ArticlesPage";
import { CounselorsPage } from "./pages/CounselorsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: GuestHome },
      { path: "articles", Component: ArticlesPage },
      { path: "counselors", Component: CounselorsPage },
      { path: "student", Component: StudentDashboard },
      { path: "counselor", Component: CounselorDashboard },
      { path: "admin", Component: AdminDashboard },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
    ],
  },
]);
