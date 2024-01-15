import { Link } from "react-router-dom";

function AuthPage() {
  return (
    <section className="vh-100" style={{ background: "#508bfc " }}>
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div
              className="card shadow-2-strong"
              style={{ borderRadius: "1rem" }}
            >
              <div className="card-body p-5 text-center">
                <div className="d-flex justify-content-around">
                  <Link to="/logIn">
                    <button
                      id="loginBtn"
                      className="btn btn-primary btn-lg btn-block"
                      type="submit"
                    >
                      Login
                    </button>
                  </Link>

                  <Link to="signUp">
                    <button
                      id="loginBtn"
                      className="btn btn-primary btn-lg btn-block"
                      type="submit"
                    >
                      SignUp
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
