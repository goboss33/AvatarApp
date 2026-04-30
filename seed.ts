import { createUserSeed } from "./lib/auth";

createUserSeed()
  .then(() => console.log("Seed completed"))
  .catch(console.error);
