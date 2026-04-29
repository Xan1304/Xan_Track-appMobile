import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export type TaskConfig = {
  key: string;
  route: string;
  icon: string;
  iconLib: 'Ionicons' | 'MaterialCommunityIcons' | 'MaterialIcons';
  color: string;
  iconColor: string;
  title: string;
  sub: string;
};

interface TaskCardProps {
  task: TaskConfig;
  storeParams: {
    id: string;
    name: string;
    addr: string;
  };
}

function TaskIcon({ task }: { task: TaskConfig }) {
  if (task.iconLib === 'Ionicons') return <Ionicons name={task.icon as any} size={22} color={task.iconColor} />;
  if (task.iconLib === 'MaterialIcons') return <MaterialIcons name={task.icon as any} size={22} color={task.iconColor} />;
  return <MaterialCommunityIcons name={task.icon as any} size={22} color={task.iconColor} />;
}

export const TaskCard = ({ task, storeParams }: TaskCardProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.taskCard}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: task.route as any,
          params: storeParams,
        } as any)
      }
    >
      <View style={[styles.taskIconBox, { backgroundColor: task.color }]}>
        <TaskIcon task={task} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskSub}>{task.sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14
  },
  taskIconBox: {
    width: 44, height: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0
  },
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  taskSub: { fontSize: 11, color: '#94a3b8' },
});
