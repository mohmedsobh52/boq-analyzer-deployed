import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { Plus, Mail, Phone, MapPin, Trash2, Edit2 } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  quotationCount: number;
}

interface Quotation {
  id: number;
  supplierId: number;
  itemCode: string;
  itemDescription: string;
  quotedPrice: number;
  leadTime: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'BuildTech Supplies Inc.',
    email: 'contact@buildtech.com',
    phone: '+1-555-0101',
    address: '123 Construction Ave, City, State',
    quotationCount: 5,
  },
  {
    id: 2,
    name: 'Premium Materials Ltd.',
    email: 'sales@premiummat.com',
    phone: '+1-555-0102',
    address: '456 Industrial Blvd, City, State',
    quotationCount: 3,
  },
];

const mockQuotations: Quotation[] = [
  {
    id: 1,
    supplierId: 1,
    itemCode: 'STRUCT-001',
    itemDescription: 'Reinforced Concrete Foundation',
    quotedPrice: 240,
    leadTime: '2 weeks',
    status: 'pending',
  },
  {
    id: 2,
    supplierId: 1,
    itemCode: 'STRUCT-002',
    itemDescription: 'Steel Reinforcement Bars',
    quotedPrice: 780,
    leadTime: '1 week',
    status: 'accepted',
  },
  {
    id: 3,
    supplierId: 2,
    itemCode: 'STRUCT-001',
    itemDescription: 'Reinforced Concrete Foundation',
    quotedPrice: 260,
    leadTime: '3 weeks',
    status: 'pending',
  },
];

export default function Suppliers() {
  const { t, language } = useI18n();
  const [suppliers] = useState<Supplier[]>(mockSuppliers);
  const [quotations] = useState<Quotation[]>(mockQuotations);
  const [selectedTab, setSelectedTab] = useState('suppliers');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{
      backgroundImage: 'url(/construction-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    }}>
      <PageHeader
        title={t('supplier.title')}
        description={language === 'ar' ? 'إدارة الموردين والعروض' : 'Manage suppliers and quotations'}
        showBackButton
        showHomeButton
      />

      <main className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border-2 border-primary rounded-sm p-1">
            <TabsTrigger value="suppliers" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {language === 'ar' ? 'الموردون' : 'Suppliers'}
            </TabsTrigger>
            <TabsTrigger value="quotations" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('supplier.quotations')}
            </TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="mt-6">
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="blueprint-input w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="blueprint-card">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">{supplier.name}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="p-2">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="outline" size="sm" className="p-2 text-destructive hover:bg-destructive/10">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail size={16} />
                      <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                        {supplier.email}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={16} />
                      <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                        {supplier.phone}
                      </a>
                    </div>

                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin size={16} className="mt-0.5" />
                      <span className="text-sm">{supplier.address}</span>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Quotations: <span className="text-primary font-bold">{supplier.quotationCount}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredSuppliers.length === 0 && (
              <Card className="blueprint-card text-center py-12">
                <p className="text-2xl text-muted-foreground mb-4">No suppliers found</p>
                <p className="text-muted-foreground mb-8">Add your first supplier to get started</p>
                <Button className="bg-primary hover:bg-accent text-primary-foreground font-bold px-6 py-2 rounded-sm border-2 border-primary hover:border-accent transition-all">
                  <Plus size={20} className="mr-2" />
                  {t('supplier.add')}
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations" className="mt-6">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Item Code</th>
                    <th>Item Description</th>
                    <th>Quoted Price</th>
                    <th>Lead Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quote) => {
                    const supplier = suppliers.find(s => s.id === quote.supplierId);
                    return (
                      <tr key={quote.id}>
                        <td className="text-primary font-bold">{supplier?.name}</td>
                        <td>{quote.itemCode}</td>
                        <td className="max-w-xs truncate">{quote.itemDescription}</td>
                        <td className="text-right text-accent font-bold">{formatCurrency(quote.quotedPrice)}</td>
                        <td>{quote.leadTime}</td>
                        <td>
                          <span className={`status-badge status-${quote.status}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
