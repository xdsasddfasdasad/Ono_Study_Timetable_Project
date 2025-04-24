import AppRouter from "./router/AppRouter";

import { seedLocalStorage } from "./utils/seedData";

if (process.env.NODE_ENV === "development") {
  seedLocalStorage();
}

function App() {
  return <AppRouter />;
}

export default App;
