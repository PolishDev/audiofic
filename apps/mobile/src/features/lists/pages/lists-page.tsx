import React from 'react';
import { Box, Text, VStack } from '@/shared';

export function ListsPage() {
  return (
    <Box className="flex-1 bg-background justify-center items-center p-6">
      <VStack space="sm" className="items-center">
        <Text className="text-2xl font-semibold text-foreground">Listas</Text>
        <Text className="text-sm text-muted-foreground text-center">
          Seus episódios salvos e histórico de reprodução
        </Text>
      </VStack>
    </Box>
  );
}
