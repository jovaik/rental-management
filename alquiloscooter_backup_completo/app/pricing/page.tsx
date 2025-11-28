
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { RoleGuard } from '@/components/auth/role-guard';
import PricingGroupsTab from '@/components/pricing/PricingGroupsTab';
import SeasonsTab from '@/components/pricing/SeasonsTab';
import UpgradesTab from '@/components/pricing/UpgradesTab';
import ExtrasTab from '@/components/pricing/ExtrasTab';
import ExperiencesTab from '@/components/pricing/ExperiencesTab';

export default function PricingPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <PricingPageContent />
    </RoleGuard>
  );
}

function PricingPageContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Tarifas</h1>
        <p className="text-gray-600">
          Gestión completa de precios, temporadas, upgrades, extras y experiencias
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="groups">Grupos de Tarifas</TabsTrigger>
          <TabsTrigger value="seasons">Temporadas</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
          <TabsTrigger value="experiences">Experiencias</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <PricingGroupsTab />
        </TabsContent>

        <TabsContent value="seasons">
          <SeasonsTab />
        </TabsContent>

        <TabsContent value="upgrades">
          <UpgradesTab />
        </TabsContent>

        <TabsContent value="extras">
          <ExtrasTab />
        </TabsContent>

        <TabsContent value="experiences">
          <ExperiencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
