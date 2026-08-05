type ExactCouponQuery<T> = {
  eq: (column: string, value: string) => T;
};

export function applyExactCouponCodeFilter<T>(
  query: ExactCouponQuery<T>,
  couponCode: string,
): T {
  return query.eq('code', couponCode);
}
