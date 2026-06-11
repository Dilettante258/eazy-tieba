import { MarkGithubIcon, StarIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import styles from "./AppLayout.module.css";

const REPO = "Dilettante258/tieba-toolbox";

async function fetchStars(): Promise<number> {
	const res = await fetch(`https://api.github.com/repos/${REPO}`);
	const data: { stargazers_count: number } = await res.json();
	return data.stargazers_count;
}

export function GitHubStars() {
	const { data: stars } = useQuery({
		queryKey: ["gh-stars"],
		queryFn: fetchStars,
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	});

	return (
		<a
			className={styles.githubLink}
			href={`https://github.com/${REPO}`}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="GitHub"
		>
			<MarkGithubIcon size={16} />
			<StarIcon size={12} />
			<span>{stars ?? "—"}</span>
		</a>
	);
}
