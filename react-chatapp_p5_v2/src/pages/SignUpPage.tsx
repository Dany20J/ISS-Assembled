import { useContext, useRef } from "react";
import { toast } from "react-toastify";
import { MediatorContext } from "../Contexts/mediator";
import * as authController from "../controllers/auth";

function SignUpPage(props: {}) {
  const phoneInput = useRef<any>();
  const passwordInput = useRef<any>();
  const mediator = useContext(MediatorContext);

  async function onSignUp(event: any) {
    const phoneNumber = phoneInput.current.value;
    const password = passwordInput.current.value;

    if (!phoneNumber.match(/^[0-9]{10}$/) || password.length === 0) {
      console.log("validate input");
      toast("validate input");
      return;
    }
    mediator?.signUp({ phoneNumber: phoneNumber, password: password });
  }

  async function onVerifyCSR(event: any) {
    const phoneNumber = phoneInput.current.value;
    if (!phoneNumber.match(/^[0-9]{10}$/)) {
      toast("Check phone number format");
      return;
    }
    mediator?.postCSR({phoneNumber:phoneNumber});
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
                <h3 className="mb-5">Sign up</h3>

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

                <div className="d-flex justify-content-around">
                  <button
                    onClick={onVerifyCSR}
                    className="btn btn-primary btn-lg btn-block"
                    type="submit"
                  >
                    CSR
                  </button>

                  <button
                    id="loginBtn"
                    onClick={onSignUp}
                    className="btn btn-primary btn-lg btn-block"
                    type="submit"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignUpPage;
