import * as endpoints from "./endpoints";

export async function signIn(phoneNumber: string, password: string) {
  let response = await fetch(endpoints.loginEndPoint, {
    method: "POST",
    body: JSON.stringify({ phoneNumber, password }),
    headers: { "Content-Type": "application/json" },
  });

  let json = (await response.json()) as { successful: boolean; error?: string };

  if (!json.successful && json.error === "Phone number not found.") {
    return signUp(phoneNumber, password);
  }
  if (!json.successful) {
    console.log(json);
    return false;
  }

  return true;
}

export async function signUp(phoneNumber: string, password: string) {
  let response = await fetch(endpoints.signUpEndPoint, {
    method: "POST",
    body: JSON.stringify({ phoneNumber, password }),
    headers: { "Content-Type": "application/json" },
  });

  let json = (await response.json()) as { successful: boolean; error?: string };
  if (!json.successful) {
    console.log(json);
    return false;
  }
  return true;
}
