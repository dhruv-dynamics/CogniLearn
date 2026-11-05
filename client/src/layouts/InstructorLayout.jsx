import InstructorNavbar from "../components/Navbar/InstructorNavbar";

const InstructorLayout = ({ children }) => {
  return (
    <div className="instructor-app-layout" style={{ width: "100%", minHeight: "100vh" }}>
      <InstructorNavbar />
      <main style={{ width: "100%", minHeight: "calc(100vh - 65px)" }}>{children}</main>
    </div>
  );
};

export default InstructorLayout;
