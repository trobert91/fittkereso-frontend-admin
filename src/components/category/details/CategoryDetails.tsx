"use client";

import {
  Accordion,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useAppSelector } from "@/store/store-hooks";
import { CategoryDetailsForm } from "./CategoryDetailsForm";
import {
  selectCategory,
  selectCategoryLoading,
} from "@/store/slices/category-slice";
import type {
  FeatureLabelConfig,
  IssueConfig,
  ProductCategoryConfig,
  UseCaseConfig,
} from "@/models/product-category";

export const CategoryDetails = () => {
  const category = useAppSelector(selectCategory);
  const loading = useAppSelector(selectCategoryLoading);
  if (!category || loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="xl" mt="lg">
      <CategoryDetailsForm />
      <CategoryConfigViewer config={category.config} />
    </Stack>
  );
};

function CategoryConfigViewer({
  config,
}: {
  config?: ProductCategoryConfig;
}) {
  if (!config) return null;
  const useCases = config.useCases ?? [];
  const features = config.features ?? [];
  if (useCases.length === 0 && features.length === 0) {
    return null;
  }

  return (
    <Card withBorder p="md">
      <Title order={4} mb="sm">
        Category Config (read-only)
      </Title>
      <Accordion multiple variant="separated">
        {useCases.length > 0 && (
          <Accordion.Item value="useCases">
            <Accordion.Control>
              Use cases
              <Badge ml="xs" size="sm">
                {useCases.length}
              </Badge>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                {useCases.map((u) => (
                  <UseCaseRow key={u.label} useCase={u} />
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        )}
        {features.length > 0 && (
          <Accordion.Item value="features">
            <Accordion.Control>
              Features
              <Badge ml="xs" size="sm">
                {features.length}
              </Badge>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                {features.map((f) => (
                  <FeatureRow key={f.label} feature={f} />
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>
    </Card>
  );
}

function UseCaseRow({ useCase }: { useCase: UseCaseConfig }) {
  return (
    <Stack gap={2}>
      <Text fw={500}>{useCase.label}</Text>
      {useCase.description && (
        <Text size="sm" c="dimmed">
          {useCase.description}
        </Text>
      )}
      {useCase.implications && useCase.implications.length > 0 && (
        <Group gap={4} wrap="wrap">
          <Text size="xs" c="dimmed">
            Implications:
          </Text>
          {useCase.implications.map((implication) => (
            <Badge key={implication} size="xs" variant="light" tt="none">
              {implication}
            </Badge>
          ))}
        </Group>
      )}
    </Stack>
  );
}

function FeatureRow({ feature }: { feature: FeatureLabelConfig }) {
  return (
    <Stack gap={2}>
      <Group gap={6}>
        <Text fw={500}>{feature.label}</Text>
        {feature.shortDescription && (
          <Badge size="xs" variant="light" tt="none">
            {feature.shortDescription}
          </Badge>
        )}
      </Group>
      {feature.description && (
        <Text size="sm" c="dimmed">
          {feature.description}
        </Text>
      )}
      {feature.issues && feature.issues.length > 0 && (
        <Stack gap={4} pl="md" mt={4}>
          {feature.issues.map((issue) => (
            <IssueRow key={issue.label} issue={issue} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function IssueRow({ issue }: { issue: IssueConfig }) {
  return (
    <Group gap={6} align="flex-start" wrap="nowrap">
      <Badge size="xs" variant="light" color="orange" tt="none">
        {issue.label}
      </Badge>
      <Text size="xs" c="dimmed">
        {issue.description}
      </Text>
    </Group>
  );
}

