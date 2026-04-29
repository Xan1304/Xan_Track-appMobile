import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderSummary } from '../../../src/hooks/useOrderSummary';

const NAVY = '#1a3a6b';
const GREEN = '#16a34a';

export default function OrderSummaryScreen() {
    const { storeId, storeName, storeAddr, totalAmount, cart } = useLocalSearchParams<{
        storeId: string;
        storeName: string;
        storeAddr: string;
        totalAmount: string;
        cart: string;
    }>();
    const router = useRouter();

    const {
        orderItems,
        salesmanName,
        distance,
        totalQty,
        loading,
        isGeneratingPdf,
        exportPDF,
        handleConfirmOrder,
    } = useOrderSummary(storeId, storeName, storeAddr, totalAmount, cart);

    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color={NAVY} />
                <Text style={styles.loadingText}>Đang chuẩn bị đơn hàng...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Biên bản đơn hàng
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >


                {/* ── Salesman ─────────────────────────────────────────────────── */}
                <View style={styles.salesmanRow}>
                    <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                    <Text style={styles.salesmanText}>Nhân viên: {salesmanName} </Text>
                </View>

                {/* ── Product list ─────────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Danh sách sản phẩm</Text>
                    <View style={styles.productCard}>
                        {orderItems.map((item, idx) => (
                            <View key={item.id}>
                                <View style={styles.productRow}>
                                    <View style={styles.productBullet} />
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {item.ten_san_pham}
                                    </Text>
                                    <Text style={styles.productQty}>×{item.quantity}</Text>
                                    <Text style={styles.productTotal}>
                                        {item.total.toLocaleString('vi-VN')}đ
                                    </Text>
                                </View>
                                {idx < orderItems.length - 1 && <View style={styles.rowDivider} />}
                            </View>
                        ))}

                        <View style={styles.totalDivider} />

                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>
                                Tổng cộng ({totalQty} sản phẩm)
                            </Text>
                            <Text style={styles.grandTotalValue}>
                                {Number(totalAmount).toLocaleString('vi-VN')}đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Step 1: PDF ───────────────────────────────────────────────── */}
                <Text style={styles.stepLabel}>Bước 1 — Xuất biên bản PDF</Text>
                <TouchableOpacity
                    style={styles.pdfBtn}
                    onPress={exportPDF}
                    activeOpacity={0.8}
                    disabled={isGeneratingPdf}
                >
                    <View style={styles.pdfIconBox}>
                        {isGeneratingPdf ? (
                            <ActivityIndicator size="small" color={GREEN} />
                        ) : (
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color={GREEN} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pdfTitle}>
                            {isGeneratingPdf ? 'Đang tạo file...' : 'Xuất biên bản PDF'}
                        </Text>
                        <Text style={styles.pdfSub}>In hoặc chia sẻ với chủ cửa hàng</Text>
                    </View>
                    {!isGeneratingPdf && (
                        <Ionicons name="share-outline" size={18} color={GREEN} />
                    )}
                </TouchableOpacity>

                {/* ── Step 2: Photo ─────────────────────────────────────────────── */}
                <Text style={styles.stepLabel}>Bước 2 — Chụp ảnh xác nhận</Text>
                <TouchableOpacity
                    style={styles.photoCard}
                    activeOpacity={0.8}
                    onPress={handleConfirmOrder}
                >
                    <View style={styles.camIconBox}>
                        <Ionicons name="camera-outline" size={26} color={NAVY} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.photoTitle}>Chụp ảnh biên bản đã ký</Text>
                        <Text style={styles.photoSub}>Bấm để mở camera và xác nhận chốt đơn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>

                {/* ── Confirm footer ────────────────────────────────────────────── */}
                <View style={styles.footerNote}>
                    <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
                    <Text style={styles.footerNoteText}>
                        Đơn hàng sẽ được lưu sau khi chụp ảnh xác nhận ở Bước 2.
                    </Text>
                </View>
            </ScrollView>

            {/* ── Bottom action bar ─────────────────────────────────────────────── */}
            <View style={styles.actionBar}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.actionBarLabel}>Tổng thanh toán</Text>
                    <Text style={styles.actionBarTotal}>
                        {Number(totalAmount).toLocaleString('vi-VN')}đ
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.confirmBtn}
                    activeOpacity={0.85}
                    onPress={handleConfirmOrder}
                >
                    <Ionicons name="camera" size={18} color="#fff" />
                    <Text style={styles.confirmBtnText}>Chụp xác nhận</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ── Layout ────────────────────────────────────────────────────────────────
    container: { flex: 1, backgroundColor: '#f5f6f8' },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f8', gap: 12 },
    loadingText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    scrollContent: { padding: 16, paddingBottom: 120 },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },

    // ── Store card ────────────────────────────────────────────────────────────
    storeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.08)',
        marginBottom: 10,
    },
    storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    storeIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#e8eef8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storeName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    storeDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    totalBadge: {
        backgroundColor: '#e8eef8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    totalBadgeText: { fontSize: 13, fontWeight: '700', color: NAVY },
    gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    gpsText: { fontSize: 12, color: '#94a3b8' },
    gpsTextActive: { color: GREEN, fontWeight: '500' },

    // ── Salesman ──────────────────────────────────────────────────────────────
    salesmanRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
        marginBottom: 14,
    },
    salesmanText: { fontSize: 12, color: '#64748b' },

    // ── Product section ───────────────────────────────────────────────────────
    section: { marginBottom: 20 },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        color: '#94a3b8',
        marginBottom: 10,
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.08)',
        paddingHorizontal: 14,
        paddingTop: 4,
        paddingBottom: 10,
    },
    productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
    productBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: NAVY, opacity: 0.4, flexShrink: 0 },
    productName: { flex: 1, fontSize: 13, color: '#334155' },
    productQty: { fontSize: 12, color: '#94a3b8', marginHorizontal: 4, minWidth: 28, textAlign: 'center' },
    productTotal: { fontSize: 13, fontWeight: '600', color: '#0f172a', minWidth: 80, textAlign: 'right' },
    rowDivider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)' },
    totalDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 6, marginBottom: 4 },
    grandTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    grandTotalLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
    grandTotalValue: { fontSize: 16, fontWeight: '700', color: NAVY },

    // ── Steps ─────────────────────────────────────────────────────────────────
    stepLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        color: '#94a3b8',
        marginBottom: 10,
    },

    // PDF button
    pdfBtn: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.08)',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18,
    },
    pdfIconBox: {
        width: 44,
        height: 44,
        borderRadius: 11,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    pdfSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

    // Photo card
    photoCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: `${NAVY}30`,
        borderStyle: 'dashed',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    camIconBox: {
        width: 50,
        height: 50,
        borderRadius: 13,
        backgroundColor: '#e8eef8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    photoSub: { fontSize: 11, color: '#64748b', marginTop: 3 },

    // Footer note
    footerNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 2 },
    footerNoteText: { flex: 1, fontSize: 11, color: '#94a3b8', lineHeight: 16 },

    // ── Bottom action bar ─────────────────────────────────────────────────────
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0,0,0,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 34 : 18,
        gap: 16,
    },
    actionBarLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
    actionBarTotal: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 2 },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: NAVY,
        paddingHorizontal: 22,
        height: 50,
        borderRadius: 14,
        shadowColor: NAVY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
});
