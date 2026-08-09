"use client";

import { useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  Group,
  Text,
} from "@mantine/core";
import {
  FaChevronDown,
  FaChevronRight,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { formatDate } from "@/utils/date";
import Link from "next/link";
import { SanitizedHtml } from "../sanitized-html";

interface CommentNode {
  authorName?: string | null;
  authorId?: string | null;
  body?: string | null;
  url?: string | null;
  externalCreationTs?: Date | null;
  upvotes?: number | null;
  parent?: CommentNode | null;
}

type Props = {
  comment: CommentNode;
  /** Content to render inside the main comment's blockquote instead of the default body */
  children?: React.ReactNode;
};

const BODY_TRUNCATE_LIMIT = 200;
const MAIN_BODY_TRUNCATE_LIMIT = 400;

const ParentCommentBox = ({
  comment,
  indent,
}: {
  comment: CommentNode;
  indent: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const body = comment.body ?? "-";
  const isTruncatable = body.length > BODY_TRUNCATE_LIMIT;
  const displayBody =
    isTruncatable && !expanded
      ? body.slice(0, BODY_TRUNCATE_LIMIT) + "…"
      : body;

  return (
    <Box
      ml={indent * 12}
      p="xs"
      mt={indent === 0 ? 0 : 4}
      style={{
        borderLeft: "2px solid var(--mantine-color-dark-4)",
        background: "var(--mantine-color-dark-7)",
        borderRadius: "var(--mantine-radius-sm)",
      }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Group gap={4} align="center" wrap="nowrap">
          <Text size="sm" fw={500} c="dimmed">
            {comment.authorName ?? "Anonymous"}
          </Text>
          {comment.authorId && (
            <Badge color="blue" variant="light" size="sm" tt="none">
              {comment.authorId}
            </Badge>
          )}
          {comment.externalCreationTs && (
            <Badge color="gray" variant="light" size="sm" tt="none">
              {formatDate(comment.externalCreationTs)}
            </Badge>
          )}
        </Group>
        <Flex gap={8} align="center">
          {(comment.upvotes ?? 0) > 0 && (
            <Text size="xs" c="dimmed">
              ▲ {comment.upvotes}
            </Text>
          )}
          {comment.url && (
            <Link
              href={comment.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Text size="xs" c="blue">
                Source ↗
              </Text>
            </Link>
          )}
        </Flex>
      </Flex>
      <Text component="div" size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
        {isTruncatable ? (
          <>
            {displayBody}{" "}
            <Anchor
              component="button"
              size="xs"
              c="blue"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Show less" : "Show more"}
            </Anchor>
          </>
        ) : (
          <SanitizedHtml html={body} />
        )}
      </Text>
    </Box>
  );
};

function collectParents(comment: CommentNode): CommentNode[] {
  const parents: CommentNode[] = [];
  let current = comment.parent;
  while (current) {
    parents.unshift(current);
    current = current.parent;
  }
  return parents;
}

export const CommentThreadTree = ({ comment, children }: Props) => {
  const parents = collectParents(comment);
  const [threadOpen, setThreadOpen] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const body = comment.body ?? "-";
  const isBodyTruncatable = body.length > MAIN_BODY_TRUNCATE_LIMIT;

  return (
    <Box>
      {parents.length > 0 && (
        <Box mb="md">
          <Button
            variant="subtle"
            size="compact-xs"
            color="gray"
            px={4}
            leftSection={
              threadOpen ? (
                <FaChevronDown size={10} />
              ) : (
                <FaChevronRight size={10} />
              )
            }
            onClick={() => setThreadOpen((open) => !open)}
            mb={6}
          >
            {threadOpen
              ? "Hide comment thread"
              : `Show comment thread (${parents.length})`}
          </Button>
          <Collapse in={threadOpen}>
            {parents.map((parent, index) => (
              <ParentCommentBox key={index} comment={parent} indent={index} />
            ))}
          </Collapse>
        </Box>
      )}

      <Group gap={4} mb="xs" wrap="wrap">
        <Badge color="blue" variant="light" size="sm" tt="none">
          {comment.authorName ?? "Anonymous"}
        </Badge>
        {comment.authorId && (
          <Badge color="blue" variant="light" size="sm" tt="none">
            {comment.authorId}
          </Badge>
        )}
        {comment.externalCreationTs && (
          <Badge color="gray" variant="light" size="sm" tt="none">
            {formatDate(comment.externalCreationTs)}
          </Badge>
        )}
        {comment.url && (
          <Button
            component={Link}
            href={comment.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            color="gray"
            size="compact-xs"
            leftSection={<FaExternalLinkAlt size={10} />}
          >
            source
          </Button>
        )}
      </Group>
      <Text
        component="div"
        size="sm"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.6,
        }}
      >
        {isBodyTruncatable && !bodyExpanded ? (
          <>
            {body.slice(0, MAIN_BODY_TRUNCATE_LIMIT) + "…"}{" "}
            <Anchor
              component="button"
              size="sm"
              c="blue"
              onClick={() => setBodyExpanded(true)}
            >
              Show more
            </Anchor>
          </>
        ) : (
          <>
            {children ?? <SanitizedHtml html={body} />}
            {isBodyTruncatable && (
              <>
                {" "}
                <Anchor
                  component="button"
                  size="sm"
                  c="blue"
                  onClick={() => setBodyExpanded(false)}
                >
                  Show less
                </Anchor>
              </>
            )}
          </>
        )}
      </Text>
    </Box>
  );
};
