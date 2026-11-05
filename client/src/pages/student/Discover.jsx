import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../api/axios";
import "../../styles/Student/Discover.css";

const Discover = () => {

  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  /* ---------------- FETCH COURSES ---------------- */

  useEffect(() => {
    fetchExploreCourses();
  }, []);

  const fetchExploreCourses = async () => {

    try {

      const res = await API.get("/courses");

      const data = res.data?.data || [];

      // Only show published courses
      const liveCourses = data.filter(course => course.isPublished);

      setCourses(liveCourses);
      setFilteredCourses(liveCourses);

    } catch (err) {

      console.error("EXPLORE FETCH ERROR 👉", err);

    } finally {

      setLoading(false);

    }

  };

  /* ---------------- SEARCH + FILTER ---------------- */

  useEffect(() => {

    let result = courses;

    if (searchTerm) {

      result = result.filter(c =>

        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||

        c.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      );

    }

    setFilteredCourses(result);

  }, [searchTerm, courses]);

  /* ---------------- UI ---------------- */

  return (

    <div className="discover-wrapper">

      <div className="discover-container">

        {/* HEADER */}

        <header className="discover-header">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="header-content"
          >

            <h1>Discover Your Next Skill 🚀</h1>

            <p className="subtitle">
              Explore high-quality courses curated by Mentor AI.
            </p>

          </motion.div>

          {/* SEARCH BAR */}

          <div className="search-box-pro">

            <input
              type="text"
              placeholder="What do you want to learn today?"
              className="discover-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <span className="search-icon">🔍</span>

          </div>

        </header>

        {/* COURSE GRID */}

        <section className="discover-results">

          {loading ? (

            <div className="loading-state">
              Finding best courses for you...
            </div>

          ) : filteredCourses.length === 0 ? (

            <div className="no-results">
              Oops! No courses found matching your search.
            </div>

          ) : (

            <div className="discover-grid">

              {filteredCourses.map((course, index) => (

                <motion.div
                  key={course._id}
                  className="discover-card glass-morph"
                  whileHover={{ y: -10 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/course/${course._id}`)}
                >

                  {/* THUMBNAIL */}

                  <div className="card-thumb">

                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail.startsWith('http') ? course.thumbnail : `${import.meta.env.VITE_API_URL}${course.thumbnail}`}
                        alt={course.title}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}

                    {/* Fallback box shown if no thumbnail or if img fails */}
                    <div className="fallback-thumb" style={{ display: course.thumbnail ? 'none' : 'flex' }}>
                       {course.title.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="badge">
                      {course.level || "Beginner"}
                    </div>

                  </div>

                  {/* BODY */}

                  <div className="card-body">

                    <h4>{course.title}</h4>

                    <div className="card-stats">

                      <span>
                        👤 {course.instructor?.name || "Instructor"}
                      </span>

                      <span className="price-tag">

                        {course.price === 0
                          ? "Free"
                          : `₹${course.price}`}

                      </span>

                    </div>

                  </div>

                </motion.div>

              ))}

            </div>

          )}

        </section>

      </div>

    </div>

  );

};

export default Discover;