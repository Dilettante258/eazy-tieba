import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "./pages/Home.tsx";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: 1,
		},
	},
});

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
					{/* TODO: Migrate remaining pages */}
					{/* <Route path="/profile/:method/:id" element={<Profile />} /> */}
					{/* <Route path="/userpost/:method/:id/:page" element={<UserPost />} /> */}
					{/* <Route path="/follow/:method/:id" element={<Follow />} /> */}
					{/* <Route path="/fan/:method/:id" element={<Fan />} /> */}
					{/* <Route path="/likeforum/:method/:id" element={<LikeForum />} /> */}
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	);
}
