import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

export interface CommentDateRangePickerProps {
  onSelected?: (range: [string | null, string | null]) => void;
  value?: [string | null, string | null];
}
export const CommentDateRangePicker = ({
  onSelected,
  value,
}: CommentDateRangePickerProps) => {
  const today = useMemo(() => dayjs(), []);
  const yesterday = useMemo(() => today.subtract(1, "day"), [today]);

  return (
    <DatePickerInput
      label="Date Range"
      numberOfColumns={2}
      presets={[
        {
          value: [
            yesterday.format("YYYY-MM-DD"),
            yesterday.format("YYYY-MM-DD"),
          ],
          label: "Yesterday",
        },
        {
          value: [today.format("YYYY-MM-DD"), today.format("YYYY-MM-DD")],
          label: "Today",
        },
        {
          value: [yesterday.format("YYYY-MM-DD"), today.format("YYYY-MM-DD")],
          label: "Last 2 days",
        },
        {
          value: [
            today.subtract(2, "day").format("YYYY-MM-DD"),
            today.format("YYYY-MM-DD"),
          ],
          label: "Last 3 days",
        },
        {
          value: [
            today.subtract(6, "day").format("YYYY-MM-DD"),
            today.format("YYYY-MM-DD"),
          ],
          label: "Last week",
        },
        {
          value: [
            today.startOf("month").format("YYYY-MM-DD"),
            today.format("YYYY-MM-DD"),
          ],
          label: "This month",
        },
        {
          value: [
            today.startOf("month").subtract(1, "month").format("YYYY-MM-DD"),
            today.startOf("month").subtract(1, "day").format("YYYY-MM-DD"),
          ],
          label: "Last month",
        },
      ]}
      type="range"
      allowSingleDateInRange
      clearable
      value={value}
      onChange={(value) => onSelected?.(value ?? [null, null])}
      maxDate={dayjs().format("YYYY-MM-DD")}
      highlightToday={true}
    />
  );
};
