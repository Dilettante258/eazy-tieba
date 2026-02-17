import {
  Button,
  FormControl,
  SegmentedControl,
  TextInput,
} from "@primer/react";
import { SearchIcon } from "@primer/octicons-react";
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Tutorial } from "./Tutorial.tsx";
import styles from "./QueryForm.module.css";

const METHODS = [
  { label: "用户名", value: "un" },
  { label: "用户 ID", value: "id" },
  { label: "贴吧 UID", value: "uid" },
] as const;

type Method = (typeof METHODS)[number]["value"];

export function QueryForm() {
  const search = useSearch({ strict: false }) as {
    method?: string;
    id?: string;
  };
  const navigate = useNavigate();

  const [method, setMethod] = useState<Method>(
    (search.method as Method) || "un",
  );
  const [value, setValue] = useState(search.id || "");

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    navigate({
      to: ".",
      search: () => ({ method, id: value.trim() }),
    });
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <SegmentedControl
          aria-label="查询方式"
          onChange={(index) => setMethod(METHODS[index].value)}
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
              {method === "un"
                ? "用户名"
                : method === "id"
                  ? "用户 ID"
                  : "贴吧 UID"}
            </FormControl.Label>
            <TextInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                method === "un"
                  ? "请输入用户名"
                  : method === "id"
                    ? "请输入用户 ID"
                    : "请输入贴吧 UID"
              }
              leadingVisual={SearchIcon}
              block
            />
          </FormControl>
          <Button type="submit" variant="primary">
            查询
          </Button>
        </div>
      </form>
      {!search.id && <Tutorial />}
    </div>
  );
}
