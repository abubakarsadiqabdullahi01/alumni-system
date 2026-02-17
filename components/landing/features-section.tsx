"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Award, Briefcase, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Feature = {
  title: string;
  description: string;
  badge: string;
  icon: ComponentType<{ className?: string }>;
};

const features: Feature[] = [
  {
    title: "Global Directory",
    description: "Find by dept/year",
    badge: "Featured",
    icon: Users,
  },
  {
    title: "Exclusive Jobs",
    description: "Alumni-only board",
    badge: "Premium",
    icon: Briefcase,
  },
  {
    title: "Celebrate Wins",
    description: "Share achievements",
    badge: "Social",
    icon: Award,
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Built for the GSU Alumni Community</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            A conversion-focused platform that drives meaningful connections and career outcomes.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ y: -8 }}
              >
                <Card className="h-full border-0 bg-white/70 shadow-xl shadow-indigo-100/40 backdrop-blur-xl transition-shadow hover:shadow-2xl hover:shadow-indigo-200/50">
                  <CardHeader>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="inline-flex rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white shadow-lg">
                        <Icon className="size-6" />
                      </div>
                      <Badge className="rounded-full border-0 bg-slate-900/90 text-slate-50">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-2xl text-slate-900">{feature.title}</CardTitle>
                    <CardDescription className="text-base text-slate-600">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-slate-600">
                    GSU Gombe Alumni keeps identity-verified members, high-intent opportunities, and milestone storytelling in one trusted destination.
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

