import { Op } from 'sequelize';
import models from '../models/index.js';
import sequelize from '../config/database.js';
import ApiError from '../utils/ErrorClass.js';
import dayjs from 'dayjs';

export interface PaymentWithBookingOrOrder {
    id: number;
    provider: 'cash' | 'vnpay';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount_cents: number;
    booking_id: number | null;
    order_id: number | null;
    paid_at: Date | null;
    created_at: Date;
    booking: {
        id: number;
        facility_id: number;
        facility?: {
            name: string;
        } | null;
    } | null;
    order: {
        id: number;
        facility_id: number;
        facility?: {
            name: string;
        } | null;
    } | null;
}

export class RevenueService {
    /**
     * Chuẩn hóa bộ lọc thời gian và cơ sở
     * Filter dựa trên paid_at, fallback created_at
     */
    private static async resolveFilters(from?: string, to?: string, facilityId?: number) {
        // Mặc định khoảng ngày: tháng hiện tại (từ đầu tháng đến hiện tại)
        const fromStr = from || dayjs().startOf('month').format('YYYY-MM-DD');
        const toStr = to || dayjs().format('YYYY-MM-DD');

        const fromDate = dayjs(fromStr).startOf('day').toDate();
        const toDate = dayjs(toStr).endOf('day').toDate();

        if (facilityId) {
            const facility = await models.Facility.findByPk(facilityId);
            if (!facility) {
                throw new ApiError('Cơ sở không tồn tại trong hệ thống!', 404);
            }
        }

        return {
            fromStr,
            toStr,
            fromDate,
            toDate,
            facilityId
        };
    }

    /**
     * Tính toán tổng quan doanh thu toàn hệ thống
     */
    static async getSummary(filters: { from?: string; to?: string; facility_id?: number }) {
        const { fromStr, toStr, fromDate, toDate, facilityId } = 
            await this.resolveFilters(filters.from, filters.to, filters.facility_id);

        const whereClause: any = {
            status: 'paid',
            [Op.and]: [
                sequelize.where(
                    sequelize.fn('COALESCE', sequelize.col('Payment.paid_at'), sequelize.col('Payment.created_at')),
                    { [Op.between]: [fromDate, toDate] }
                )
            ]
        };

        if (facilityId) {
            whereClause[Op.or] = [
                { '$booking.facility_id$': facilityId },
                { '$order.facility_id$': facilityId }
            ];
        }

        const paymentsRaw = await models.Payment.findAll({
            where: whereClause,
            include: [
                {
                    model: models.Booking,
                    as: 'booking',
                    attributes: ['id', 'facility_id'],
                    required: false
                },
                {
                    model: models.Order,
                    as: 'order',
                    attributes: ['id', 'facility_id'],
                    required: false
                }
            ]
        });

        const payments = paymentsRaw as unknown as PaymentWithBookingOrOrder[];

        let total_amount_cents = 0;
        let booking_amount_cents = 0;
        let order_amount_cents = 0;
        let cash_amount_cents = 0;
        let vnpay_amount_cents = 0;

        const paidBookingIds = new Set<number>();
        const paidOrderIds = new Set<number>();

        for (const p of payments) {
            if (!p.booking_id && !p.order_id) continue;

            total_amount_cents += p.amount_cents;

            if (p.booking_id) {
                booking_amount_cents += p.amount_cents;
                paidBookingIds.add(p.booking_id);
            } else if (p.order_id) {
                order_amount_cents += p.amount_cents;
                paidOrderIds.add(p.order_id);
            }

            if (p.provider === 'cash') {
                cash_amount_cents += p.amount_cents;
            } else if (p.provider === 'vnpay') {
                vnpay_amount_cents += p.amount_cents;
            }
        }

        const average_transaction_amount_cents = payments.length > 0 ? total_amount_cents / payments.length : 0;

        return {
            total_amount_cents,
            total_transactions: payments.length,
            booking_amount_cents,
            order_amount_cents,
            booking_transactions: paidBookingIds.size,
            order_transactions: paidOrderIds.size,
            cash_amount_cents,
            vnpay_amount_cents,
            average_transaction_amount_cents,
            from: fromStr,
            to: toStr
        };
    }

    /**
     * Lấy dữ liệu vẽ chart theo ngày hoặc theo tháng
     */
    static async getChart(filters: { from?: string; to?: string; facility_id?: number; group_by?: 'day' | 'month' }) {
        const { fromStr, toStr, fromDate, toDate, facilityId } = 
            await this.resolveFilters(filters.from, filters.to, filters.facility_id);

        const group_by = filters.group_by || 'day';

        const whereClause: any = {
            status: 'paid',
            [Op.and]: [
                sequelize.where(
                    sequelize.fn('COALESCE', sequelize.col('Payment.paid_at'), sequelize.col('Payment.created_at')),
                    { [Op.between]: [fromDate, toDate] }
                )
            ]
        };

        if (facilityId) {
            whereClause[Op.or] = [
                { '$booking.facility_id$': facilityId },
                { '$order.facility_id$': facilityId }
            ];
        }

        const paymentsRaw = await models.Payment.findAll({
            where: whereClause,
            include: [
                {
                    model: models.Booking,
                    as: 'booking',
                    attributes: ['id', 'facility_id'],
                    required: false
                },
                {
                    model: models.Order,
                    as: 'order',
                    attributes: ['id', 'facility_id'],
                    required: false
                }
            ]
        });

        const payments = paymentsRaw as unknown as PaymentWithBookingOrOrder[];

        const chartMap = new Map<string, {
            label: string;
            total_amount_cents: number;
            booking_amount_cents: number;
            order_amount_cents: number;
            total_transactions: number;
        }>();

        // Điền khuyết dữ liệu
        if (group_by === 'day') {
            let current = dayjs(fromStr);
            const end = dayjs(toStr);
            while (current.isBefore(end) || current.isSame(end, 'day')) {
                const label = current.format('YYYY-MM-DD');
                chartMap.set(label, {
                    label,
                    total_amount_cents: 0,
                    booking_amount_cents: 0,
                    order_amount_cents: 0,
                    total_transactions: 0
                });
                current = current.add(1, 'day');
            }
        } else {
            let current = dayjs(fromStr).startOf('month');
            const end = dayjs(toStr).startOf('month');
            while (current.isBefore(end) || current.isSame(end, 'month')) {
                const label = current.format('YYYY-MM');
                chartMap.set(label, {
                    label,
                    total_amount_cents: 0,
                    booking_amount_cents: 0,
                    order_amount_cents: 0,
                    total_transactions: 0
                });
                current = current.add(1, 'month');
            }
        }

        for (const p of payments) {
            if (!p.booking_id && !p.order_id) continue;

            const dateVal = p.paid_at || p.created_at;
            const key = group_by === 'day' 
                ? dayjs(dateVal).format('YYYY-MM-DD') 
                : dayjs(dateVal).format('YYYY-MM');

            const item = chartMap.get(key);
            if (item) {
                item.total_amount_cents += p.amount_cents;
                item.total_transactions += 1;
                if (p.booking_id) {
                    item.booking_amount_cents += p.amount_cents;
                } else if (p.order_id) {
                    item.order_amount_cents += p.amount_cents;
                }
            }
        }

        return {
            group_by,
            data: Array.from(chartMap.values())
        };
    }

    /**
     * Phân tích tỷ lệ doanh thu theo provider & source
     */
    static async getBreakdown(filters: { from?: string; to?: string; facility_id?: number }) {
        const { fromDate, toDate, facilityId } = 
            await this.resolveFilters(filters.from, filters.to, filters.facility_id);

        const whereClause: any = {
            status: 'paid',
            [Op.and]: [
                sequelize.where(
                    sequelize.fn('COALESCE', sequelize.col('Payment.paid_at'), sequelize.col('Payment.created_at')),
                    { [Op.between]: [fromDate, toDate] }
                )
            ]
        };

        if (facilityId) {
            whereClause[Op.or] = [
                { '$booking.facility_id$': facilityId },
                { '$order.facility_id$': facilityId }
            ];
        }

        const paymentsRaw = await models.Payment.findAll({
            where: whereClause,
            include: [
                {
                    model: models.Booking,
                    as: 'booking',
                    attributes: ['id', 'facility_id'],
                    required: false
                },
                {
                    model: models.Order,
                    as: 'order',
                    attributes: ['id', 'facility_id'],
                    required: false
                }
            ]
        });

        const payments = paymentsRaw as unknown as PaymentWithBookingOrOrder[];

        let cash_total = 0;
        let cash_count = 0;
        let vnpay_total = 0;
        let vnpay_count = 0;

        let booking_total = 0;
        let booking_count = 0;
        let order_total = 0;
        let order_count = 0;

        for (const p of payments) {
            if (!p.booking_id && !p.order_id) continue;

            if (p.provider === 'cash') {
                cash_total += p.amount_cents;
                cash_count += 1;
            } else if (p.provider === 'vnpay') {
                vnpay_total += p.amount_cents;
                vnpay_count += 1;
            }

            if (p.booking_id) {
                booking_total += p.amount_cents;
                booking_count += 1;
            } else if (p.order_id) {
                order_total += p.amount_cents;
                order_count += 1;
            }
        }

        return {
            by_provider: [
                {
                    provider: 'cash' as const,
                    total_amount_cents: cash_total,
                    total_transactions: cash_count
                },
                {
                    provider: 'vnpay' as const,
                    total_amount_cents: vnpay_total,
                    total_transactions: vnpay_count
                }
            ],
            by_source: [
                {
                    source: 'booking' as const,
                    total_amount_cents: booking_total,
                    total_transactions: booking_count
                },
                {
                    source: 'order' as const,
                    total_amount_cents: order_total,
                    total_transactions: order_count
                }
            ]
        };
    }

    /**
     * Lấy danh sách giao dịch booking & order payment phân trang
     */
    static async getTransactions(filters: {
        from?: string;
        to?: string;
        facility_id?: number;
        provider?: 'all' | 'cash' | 'vnpay';
        source?: 'all' | 'booking' | 'order';
        page: number;
        limit: number;
        sortBy: 'paidAt' | 'amount';
        sortOrder: 'asc' | 'desc';
    }) {
        const { fromDate, toDate, facilityId } = 
            await this.resolveFilters(filters.from, filters.to, filters.facility_id);

        const offset = (filters.page - 1) * filters.limit;

        const whereClause: any = {
            status: 'paid',
            [Op.and]: [
                sequelize.where(
                    sequelize.fn('COALESCE', sequelize.col('Payment.paid_at'), sequelize.col('Payment.created_at')),
                    { [Op.between]: [fromDate, toDate] }
                )
            ]
        };

        if (filters.provider && filters.provider !== 'all') {
            whereClause.provider = filters.provider;
        }

        const sourceFilter = filters.source || 'all';
        if (sourceFilter === 'booking') {
            whereClause.booking_id = { [Op.ne]: null };
        } else if (sourceFilter === 'order') {
            whereClause.order_id = { [Op.ne]: null };
        } else {
            whereClause[Op.or] = [
                { booking_id: { [Op.ne]: null } },
                { order_id: { [Op.ne]: null } }
            ];
        }

        if (facilityId) {
            whereClause[Op.and].push({
                [Op.or]: [
                    { '$booking.facility_id$': facilityId },
                    { '$order.facility_id$': facilityId }
                ]
            });
        }

        let orderExpr: any[] = [];
        if (filters.sortBy === 'amount') {
            orderExpr = [['amount_cents', filters.sortOrder]];
        } else {
            orderExpr = [
                [sequelize.fn('COALESCE', sequelize.col('Payment.paid_at'), sequelize.col('Payment.created_at')), filters.sortOrder]
            ];
        }

        const paymentsResult = await models.Payment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.Booking,
                    as: 'booking',
                    attributes: ['id', 'facility_id'],
                    required: false,
                    include: [
                        {
                            model: models.Facility,
                            as: 'facility',
                            attributes: ['name'],
                            required: false
                        }
                    ]
                },
                {
                    model: models.Order,
                    as: 'order',
                    attributes: ['id', 'facility_id'],
                    required: false,
                    include: [
                        {
                            model: models.Facility,
                            as: 'facility',
                            attributes: ['name'],
                            required: false
                        }
                    ]
                }
            ],
            limit: filters.limit,
            offset,
            order: orderExpr
        });

        const rows = paymentsResult.rows as unknown as PaymentWithBookingOrOrder[];
        const count = paymentsResult.count;

        const items = rows.map((p) => {
            const booking = p.booking;
            const order = p.order;
            
            const sourceVal: 'booking' | 'order' = p.booking_id ? 'booking' : 'order';
            
            let facility_id: number | null = null;
            let facility_name: string | null = null;

            if (p.booking_id && booking) {
                facility_id = booking.facility_id;
                facility_name = booking.facility ? booking.facility.name : null;
            } else if (p.order_id && order) {
                facility_id = order.facility_id;
                facility_name = order.facility ? order.facility.name : null;
            }

            return {
                payment_id: p.id,
                booking_id: p.booking_id,
                order_id: p.order_id,
                source: sourceVal,
                provider: p.provider,
                status: 'paid' as const,
                amount_cents: p.amount_cents,
                paid_at: p.paid_at ? p.paid_at.toISOString() : null,
                created_at: p.created_at.toISOString(),
                facility_id,
                facility_name
            };
        });

        return {
            items,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: count,
                total_pages: Math.ceil(count / filters.limit)
            }
        };
    }
}
