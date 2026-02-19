import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, DollarSign, CreditCard, BookOpen } from 'lucide-react';

import { CashRegistersList } from '@/components/finance/CashRegistersList';
import { CashTransactionsList } from '@/components/finance/CashTransactionsList';
import { PaymentsList } from '@/components/finance/PaymentsList';

export default function FinancePage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('finance.title')}</h1>
          <p className="text-muted-foreground">{t('finance.subtitle')}</p>
        </div>

        <Tabs defaultValue="cash_registers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-4xl">
            <TabsTrigger value="cash_registers">{t('finance.cashRegisters')}</TabsTrigger>
            <TabsTrigger value="cash_balance">{t('finance.cashBalance')}</TabsTrigger>
            <TabsTrigger value="payments">{t('finance.payments')}</TabsTrigger>
            <TabsTrigger value="bank_journal">{t('finance.bankJournal')}</TabsTrigger>
          </TabsList>

          <TabsContent value="cash_registers">
            <CashRegistersList />
          </TabsContent>

          <TabsContent value="cash_balance">
            <CashTransactionsList />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsList />
          </TabsContent>
          
          <TabsContent value="bank_journal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('finance.bankJournal')}
                </CardTitle>
                <CardDescription>
                  Suivi des chéquiers et opérations bancaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Module en cours de développement
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
