import {
  ZapIcon,
  SearchIcon,
  ToolsIcon,
  PeopleIcon,
  ListUnorderedIcon,
  PersonAddIcon,
  MentionIcon,
  OrganizationIcon,
  IdBadgeIcon,
  GraphIcon,
} from "@primer/octicons-react";
import { Link } from "@tanstack/react-router";
import styles from "./ServiceList.module.css";

function DotsBg({ fill, id }: { fill: string; id: string }) {
  return (
    <svg
      className={styles.dotsBg}
      style={{ fill }}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width="60"
          height="60"
          patternTransform="scale(0.4) rotate(0)"
        >
          <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
          <path
            d="M 4.95 2.7 a 2.25 2.25 90 0 1 -2.25 2.25 a 2.25 2.25 90 0 1 -2.25 -2.25 a 2.25 2.25 90 0 1 2.25 -2.25 a 2.25 2.25 90 0 1 2.25 2.25"
            strokeWidth="1"
            stroke="none"
            fill="inherit"
          />
        </pattern>
      </defs>
      <rect
        width="800%"
        height="400%"
        transform="translate(15,20)"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

// ── 统计区域 ──

const STATS = [
  { icon: ZapIcon, value: "90+", label: "人次日均访问量", color: "#1d8ae7" },
  {
    icon: SearchIcon,
    value: "2nd",
    label: "Bing搜索关键词中曾排行第二",
    color: "#f76b15",
  },
  {
    icon: ToolsIcon,
    value: "6+",
    label: "常用功能并持续更新中",
    color: "#e75054",
  },
  {
    icon: PeopleIcon,
    value: "3000+",
    label: "累计独立使用者",
    color: "#d6409f",
  },
];

function StatsSection() {
  return (
    <div className={styles.statsSection}>
      <DotsBg fill="#CDCED6" id="dots-stats" />
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>一个饱受欢迎的工具箱</h2>
        <div className={styles.statsGrid}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statIcon}>
                <s.icon size={28} fill={s.color} />
              </div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 工具列表区域 ──

const TOOLS = [
  {
    icon: ListUnorderedIcon,
    title: "发言查询",
    description: "查询用户发言",
    href: "/userpost",
  },
  {
    icon: PersonAddIcon,
    title: "关注查询",
    description: "查询用户关注了哪些用户",
    href: "/follow",
  },
  {
    icon: MentionIcon,
    title: "粉丝查询",
    description: "查询用户的粉丝",
    href: "/fan",
  },
  {
    icon: OrganizationIcon,
    title: "关注贴吧查询",
    description: "查询用户关注了哪些贴吧",
    href: "/likeforum",
  },
  {
    icon: IdBadgeIcon,
    title: "个人资料查询",
    description: "查询用户个人资料",
    href: "/profile",
  },
  {
    icon: GraphIcon,
    title: "用户发帖分析",
    description: "对用户历史发言进行数据分析",
    href: "/postanalysis",
  },
];

function ToolsSection() {
  return (
    <div className={styles.toolsSection}>
      <DotsBg fill="#5A6169" id="dots-tools" />
      <div className={styles.content}>
        <h2 className={styles.toolsSectionTitle}>功能列表</h2>
        <div className={styles.toolsGrid}>
          {TOOLS.map((t) => (
            <Link key={t.title} className={styles.toolItem} to={t.href}>
              <t.icon size={128} className={styles.toolBgIcon} />
              <div className={styles.toolItemContent}>
                <t.icon size={32} className={styles.toolIcon} />
                <h3>{t.title}</h3>
                <p>{t.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ServiceList() {
  return (
    <div className={styles.container}>
      <StatsSection />
      <ToolsSection />
    </div>
  );
}
