import { type ReactNode, useState } from "react";
import styles from "./Tutorial.module.css";

const TABS: { label: string; content: ReactNode }[] = [
	{
		label: "贴吧 UID",
		content: (
			<>
				<p className={styles.desc}>
					百度贴吧手机端用户个人主页的 UID，是最容易获取的身份标识。
					<br />
					在贴吧 App 中打开用户主页，点击「分享」，复制的内容格式如：
				</p>
				<p className={styles.desc}>
					<code>
						@🎀Admire😈@给你分享了贴吧号#3364447105#整段复制后打开贴吧即可找到Ta
					</code>
				</p>
				<p className={styles.desc}>
					其中 <code>#3364447105#</code> 内的数字即为 UID。
				</p>
			</>
		),
	},
	{
		label: "用户名",
		content: (
			<p className={styles.desc}>
				传统的身份标识，不可更改且唯一。但 2019
				年后通过手机号快速注册的用户可能没有百度用户名（为空字符串）。
				<br />
				可在用户个人主页 URL 中找到，格式如：
				<br />
				<code>tieba.baidu.com/home/main?un=用户名</code>
			</p>
		),
	},
	{
		label: "用户 ID",
		content: (
			<>
				<div className={styles.jsonBlock}>
					<span className={styles.jsonPunc}>{"{"}</span>
					<br />
					{"  "}
					<span className={styles.jsonKey}>"tbs"</span>
					<span className={styles.jsonPunc}>: </span>
					<span className={styles.jsonStr}>"a906665dd7a0c1c7"</span>
					<span className={styles.jsonPunc}>,</span>
					<br />
					{"  "}
					<span className={styles.jsonKey}>"raw_name"</span>
					<span className={styles.jsonPunc}>: </span>
					<span className={styles.jsonStr}>"Admire_02"</span>
					<span className={styles.jsonPunc}>,</span>
					<br />
					{"  "}
					<span className={styles.jsonKey}>"id"</span>
					<span className={styles.jsonPunc}>: </span>
					<span className={styles.jsonNum}>5991323492</span>
					<span className={styles.jsonPunc}>,</span>
					<br />
					{"  "}
					<span className={styles.jsonKey}>"creator"</span>
					<span className={styles.jsonPunc}>: </span>
					<span className={styles.jsonOmit}>……</span>
					<br />
					<span className={styles.jsonPunc}>{"}"}</span>
				</div>
				<p className={styles.desc}>
					百度贴吧内部数字身份标识，不可直接获得，但具有唯一性。
					广泛运用在各接口中，可从接口返回数据中找到。
				</p>
			</>
		),
	},
];

export function TutorialContent() {
	const [activeTab, setActiveTab] = useState(0);
	return (
		<>
			<nav className={styles.tabNav} aria-label="身份标识说明">
				{TABS.map((tab, i) => (
					<button
						key={tab.label}
						type="button"
						role="tab"
						aria-selected={activeTab === i}
						className={`${styles.tab} ${activeTab === i ? styles.tabSelected : ""}`}
						onClick={() => setActiveTab(i)}
					>
						{tab.label}
					</button>
				))}
			</nav>
			<div className={styles.panel} role="tabpanel">
				{TABS[activeTab].content}
			</div>
		</>
	);
}

export function Tutorial() {
	return (
		<details className={styles.tutorial} open>
			<summary className={styles.trigger}>
				一个百度账号有多种身份标识，本工具箱支持三种查询方式
			</summary>
			<TutorialContent />
		</details>
	);
}
