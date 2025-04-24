import AppRouter from "./router/AppRouter";

import { seedLocalStorage } from "./utils/seedData";

if (process.env.NODE_ENV === "development") {
  seedLocalStorage();
  window.seed = () => seedLocalStorage(true);
}

function App() {
  return <AppRouter />;
}

export default App;
