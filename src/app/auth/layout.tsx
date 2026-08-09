import { Box, Center, Flex, SimpleGrid, Text, Title } from "@mantine/core";
import demoImg from "@assets/app-demo.webp";
import Image from "next/image";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimpleGrid mih="100vh" p="md" cols={{ base: 1, lg: 2 }}>
      <Flex direction="column" align="flex-start">
        <Center flex={1} w="100%">
          <Box maw="25rem">
            <Logo
              size="3rem"
              display="block"
              c="var(--mantine-primary-color-filled)"
              mb="xl"
            />

            {children}
          </Box>
        </Center>
      </Flex>

      <Center
        ta="center"
        p="4rem"
        bg="var(--mantine-color-default-hover)"
        display={{ base: "none", lg: "flex" }}
        style={{ borderRadius: "var(--mantine-radius-md)" }}
      >
        <Box maw="40rem">
          <Title order={2}>The simplest way to manage your workspace.</Title>
          <Text my="lg" c="dimmed">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint velit officia consequat duis.
          </Text>

          <Image src={demoImg} alt="Demo" />
        </Box>
      </Center>
    </SimpleGrid>
  );
}
