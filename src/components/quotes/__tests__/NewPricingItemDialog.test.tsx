import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { NewPricingItemDialog } from '../NewPricingItemDialog';

const createdItem = {
  id: 'new-id',
  category: 'bestrating',
  item_name: 'Uitbreken straatwerk',
  unit: 'm²',
  selling_price_default: 5,
  item_type: 'arbeid' as const
};

describe('NewPricingItemDialog', () => {
  const onCreated = vi.fn();
  const onClose = vi.fn();
  let container: HTMLDivElement;
  let root: Root;

  const renderDialog = async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <NewPricingItemDialog
          description="Uitbreken straatwerk"
          lineType="arbeid"
          unit="m²"
          unitPrice={5}
          categories={['bestrating', 'grondwerk', 'overig']}
          defaultCategory="bestrating"
          onCreated={onCreated}
          onClose={onClose}
        />
      );
    });
  };

  const findButton = (text: string): HTMLButtonElement => {
    const button = [...container.querySelectorAll('button')].find(b =>
      (b.textContent ?? '').includes(text)
    );
    if (!button) throw new Error(`Knop "${text}" niet gevonden`);
    return button;
  };

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ pricing: createdItem })
      })
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('toont de omschrijving voorgevuld als itemnaam', async () => {
    await renderDialog();
    const input = container.querySelector('input');
    expect(input?.value).toBe('Uitbreken straatwerk');
  });

  it('maakt bij bevestigen het item aan via de pricing-API en koppelt terug', async () => {
    await renderDialog();

    await act(async () => {
      findButton('Ja, toevoegen').click();
    });

    expect(onCreated).toHaveBeenCalledWith(createdItem);

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/pricing');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      item_name: 'Uitbreken straatwerk',
      category: 'bestrating',
      item_type: 'arbeid',
      unit: 'm²',
      selling_price_default: 5,
      is_active: true
    });
  });

  it('doet niets richting de API bij "Nee"', async () => {
    await renderDialog();

    await act(async () => {
      findButton('Nee, alleen deze offerte').click();
    });

    expect(onClose).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
