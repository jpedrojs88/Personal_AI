ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workoutPlans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workoutDays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workoutExercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workoutLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bodyMetrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aiChatMessages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "users" FROM anon, authenticated;
REVOKE ALL ON TABLE "profiles" FROM anon, authenticated;
REVOKE ALL ON TABLE "workoutPlans" FROM anon, authenticated;
REVOKE ALL ON TABLE "workoutDays" FROM anon, authenticated;
REVOKE ALL ON TABLE "workoutExercises" FROM anon, authenticated;
REVOKE ALL ON TABLE "workoutLogs" FROM anon, authenticated;
REVOKE ALL ON TABLE "bodyMetrics" FROM anon, authenticated;
REVOKE ALL ON TABLE "aiChatMessages" FROM anon, authenticated;
REVOKE ALL ON TABLE "subscriptions" FROM anon, authenticated;
