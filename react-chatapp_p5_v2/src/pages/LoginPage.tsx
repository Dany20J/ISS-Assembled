import { useContext, useRef } from "react";
import { MediatorContext } from "../Contexts/mediator";
import * as authController from "../controllers/auth";

function LoginPage(props: {}) {
  const phoneInput = useRef<any>();
  const passwordInput = useRef<any>();
  const mediator = useContext(MediatorContext);

  async function onLogin(event: any) {
    const phoneNumber = phoneInput.current.value;
    const password = passwordInput.current.value;

    if (!phoneNumber.match(/^[0-9]{10}$/) || password.length === 0) {
      console.log("validate input");
      return;
    }
    mediator?.signIn({ phoneNumber: phoneNumber, password: password });
  }

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
                <h3 className="mb-5">Sign in</h3>

                <div className="form-outline mb-4">
                  <input
                    id="phoneInput"
                    ref={phoneInput}
                    placeholder="Phone"
                    type="text"
                    className="form-control form-control-lg"
                  />
                </div>

                <div className="form-outline mb-4">
                  <input
                    ref={passwordInput}
                    id="passwordInput"
                    placeholder="password"
                    type="password"
                    className="form-control form-control-lg"
                  />
                </div>

                <button
                  id="loginBtn"
                  onClick={onLogin}
                  className="btn btn-primary btn-lg btn-block"
                  type="submit"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
