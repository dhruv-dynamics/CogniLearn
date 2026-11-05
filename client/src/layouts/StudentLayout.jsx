import StudentNavbar from "../components/Navbar/StudentNavbar";

const StudentLayout = ({ children }) => {
  return (
    <div className="student-app-layout" style={{ width: "100%", minHeight: "100vh" }}>
      <StudentNavbar />
      <main style={{ width: "100%", minHeight: "calc(100vh - 75px)" }}>{children}</main>
    </div>
  );
};

export default StudentLayout;
