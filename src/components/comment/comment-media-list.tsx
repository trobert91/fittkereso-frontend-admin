"use client";

import { ActionIcon, Image, Modal, Table, Text, Tooltip } from "@mantine/core";
import { isEmpty } from "lodash";
import { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { CommentMedia } from "@/models/user-comment";

type Props = {
  media: CommentMedia[];
};

export const CommentMediaList = ({ media }: Props) => {
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const visibleMedia = media.filter((item) => item.url || item.content);

  if (isEmpty(visibleMedia)) return null;

  return (
    <>
      <Table verticalSpacing="xs">
        <Table.Tbody>
          {visibleMedia.map((item, index) => (
            <Table.Tr key={index}>
              <Table.Td width={120}>
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.content ?? "media"}
                    w={100}
                    h={100}
                    radius="sm"
                    fit="contain"
                    style={{ cursor: "pointer" }}
                    onClick={() => setModalUrl(item.url)}
                  />
                ) : (
                  <Tooltip label={item.url} disabled={!!item.content}>
                    <ActionIcon
                      component="a"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="subtle"
                      color="blue"
                      size="sm"
                    >
                      <FaExternalLinkAlt size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Table.Td>
              <Table.Td>
                {item.content ? (
                  item.type === "link" ? (
                    <Text
                      size="sm"
                      component="a"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      c="blue"
                      style={{ textDecoration: "none" }}
                    >
                      {item.content}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      {item.content}
                    </Text>
                  )
                ) : (
                  <Text size="sm" c="dimmed" style={{ wordBreak: "break-all" }}>
                    {item.url}
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={!!modalUrl}
        onClose={() => setModalUrl(null)}
        size="auto"
        padding="xs"
        withCloseButton
        centered
      >
        {modalUrl && (
          <Image src={modalUrl} alt="media" fit="contain" maw="90vw" mah="85vh" />
        )}
      </Modal>
    </>
  );
};
