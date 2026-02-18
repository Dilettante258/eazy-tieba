import {
	Button,
	FormControl,
	SegmentedControl,
	TextInput,
} from "@primer/react";
import { SearchIcon, XCircleFillIcon } from "@primer/octicons-react";
import { startTransition, useState, ViewTransition } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Method } from "../hooks/queries.ts";
import { ProfileCard } from "./ProfileCard.tsx";
import { Tutorial } from "./Tutorial.tsx";
import styles from "./QueryForm.module.css";

const METHODS = [
	{ label: "贴吧 UID", value: "uid" },
	{ label: "用户名", value: "un" },
	{ label: "用户 ID", value: "id" },
] as const;

type MethodValue = (typeof METHODS)[number]["value"];

/** 根据查询方式校验输入值，返回错误信息或 null */
function validate(method: MethodValue, value: string): string | null {
	const v = value.trim();
	if (!v) return null;
	if (method === "uid" && !/^\d{10}$/.test(v))
		return "贴吧 UID 应为 10 位数字";
	if (method === "id" && !/^\d+$/.test(v)) return "用户 ID 应为纯数字";
	return null;
}

export function QueryForm() {
	const search = useSearch({ strict: false }) as {
		method?: string;
		id?: string;
	};
	const navigate = useNavigate();

	const [method, setMethod] = useState<MethodValue>(
		(search.method as MethodValue) || "uid",
	);
	const [value, setValue] = useState(search.id || "");
	const [error, setError] = useState<string | null>(null);

	const hasQuery = !!search.method && !!search.id;

	const handleSubmit = (e: React.SubmitEvent) => {
		startTransition(() => {
			e.preventDefault();
			const trimmed = value.trim();
			if (!trimmed) return;
			const err = validate(method, trimmed);
			if (err) {
				setError(err);
				return;
			}
			navigate({
				to: ".",
				search: () => ({ method, id: trimmed }),
			});
		});
	};

	return (
		<div className={styles.wrapper}>
			<div
				className={styles.layout}
				data-has-profile={hasQuery ? "true" : "false"}
			>
				{/* 左侧：表单 */}
				<div className={styles.formSide}>
					<form className={styles.form} onSubmit={handleSubmit}>
						<SegmentedControl
							aria-label="查询方式"
							onChange={(index) => {
							setMethod(METHODS[index].value);
							setError(null);
						}}
						>
							{METHODS.map((m) => (
								<SegmentedControl.Button
									key={m.value}
									selected={method === m.value}
								>
									{m.label}
								</SegmentedControl.Button>
							))}
						</SegmentedControl>

						<div className={styles.searchRow}>
							<FormControl className={styles.inputWrap}>
								<FormControl.Label visuallyHidden>
									{method === "uid"
										? "贴吧 UID"
										: method === "un"
											? "用户名"
											: "用户 ID"}
								</FormControl.Label>
								<TextInput
									value={value}
									onChange={(e) => {
									setValue(e.target.value);
									if (error) setError(null);
								}}
									placeholder={
										method === "uid"
											? "请输入贴吧 UID"
											: method === "un"
												? "请输入用户名"
												: "请输入用户 ID"
									}
									leadingVisual={SearchIcon}
									trailingAction={
										value ? (
											<TextInput.Action
												onClick={() => {
													setValue("");
												}}
												icon={XCircleFillIcon}
												aria-label="Clear input"
											/>
										) : undefined
									}
									block
								/>
								{error && (
									<FormControl.Validation variant="error">
										{error}
									</FormControl.Validation>
								)}
							</FormControl>
							<Button
								type="submit"
								variant="primary"
								disabled={!value.trim()}
							>
								查询
							</Button>
						</div>
					</form>
				</div>

				{/* 右侧：用户资料卡片 */}
				<div className={styles.profileSide}>
					{hasQuery && (
						<ProfileCard method={search.method as Method} id={search.id!} />
					)}
				</div>
			</div>

			{!search.id && (
				<ViewTransition>
					<Tutorial />
				</ViewTransition>
			)}
		</div>
	);
}
