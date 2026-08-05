export type TrackableOrder = {
  id: string;
  total_amount: number;
  order_items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
};

export const purchaseStorageKey = (orderId: string): string =>
  `blue-velvet:purchase:${orderId}`;

export const isPurchaseEligible = (
  status: string,
  isHistoryView: boolean,
  alreadyTracked: boolean,
): boolean => status === 'confirmed' && !isHistoryView && !alreadyTracked;

export const buildMetaPurchasePayload = (order: TrackableOrder) => ({
  value: order.total_amount,
  currency: 'MXN',
  content_ids: order.order_items.map(item => item.product_id),
  contents: order.order_items.map(item => ({ id: item.product_id, quantity: item.quantity })),
  content_name: order.order_items.map(item => item.product_name).join(', '),
  content_type: 'product',
  order_id: order.id,
});
