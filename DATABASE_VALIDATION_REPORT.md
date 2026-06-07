# SEHub — Database Validation Report

> **Ngày validation:** 2026-06-05  
> **Nguồn dữ liệu:** Truy vấn trực tiếp SQL Server — **không suy đoán**

---

## Connection Info

| Thuộc tính | Giá trị |
|------------|---------|
| Server | `DESKTOP-AN9LFU8\SQL2019` |
| Database | `SEHubDb` |
| Authentication | SQL Server (`sa`) |
| Tool | `sqlcmd` |
| Kết quả kết nối | **SUCCESS** (exit code 0) |

---

## Validation Checklist

| Kiểm tra | Kỳ vọng | Thực tế | Kết quả |
|----------|---------|---------|---------|
| `admin@sehub.local` tồn tại | Có | 1 user, Email = `admin@sehub.local` | **PASS** |
| Admin user có role Admin | Admin | `AspNetUserRoles` → Role `Admin` | **PASS** |
| 3 roles tồn tại | Student, Moderator, Admin | COUNT = 3, đủ 3 tên | **PASS** |
| 3 subscription plans | 1m, 8m, 4y | COUNT = 3, đủ 3 code | **PASS** |
| 4 level configs | Bronze, Silver, Gold, Platinum | COUNT = 4, đủ 4 tên | **PASS** |

---

## 1. AspNetUsers

### Query

```sql
SELECT COUNT(*) AS Total FROM AspNetUsers;
SELECT TOP 5 Id, UserName, Email, DisplayName, IsBanned, Points
FROM AspNetUsers ORDER BY Email;
```

### Tổng số record

| Total |
|-------|
| **1** |

### 5 record đầu tiên (toàn bộ bảng — 1 record)

| Id | UserName | Email | DisplayName | IsBanned | Points |
|----|----------|-------|-------------|----------|--------|
| `284D6130-47C2-44F4-A1DA-F2F85977018C` | admin | admin@sehub.local | SEHub Admin | 0 | 0 |

### Role của admin

```sql
SELECT u.Email, r.Name AS RoleName
FROM AspNetUsers u
INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE u.Email = 'admin@sehub.local';
```

| Email | RoleName |
|-------|----------|
| admin@sehub.local | Admin |

---

## 2. AspNetRoles

### Query

```sql
SELECT COUNT(*) AS Total FROM AspNetRoles;
SELECT TOP 5 Id, Name, NormalizedName FROM AspNetRoles ORDER BY Name;
```

### Tổng số record

| Total |
|-------|
| **3** |

### 5 record đầu tiên (toàn bộ bảng — 3 record)

| Id | Name | NormalizedName |
|----|------|----------------|
| `4458CF5A-EAE8-42FC-E50D-08DEC2B73872` | Admin | ADMIN |
| `138BEC0B-60E6-4617-E50C-08DEC2B73872` | Moderator | MODERATOR |
| `95143B5E-BEBB-41B9-E50B-08DEC2B73872` | Student | STUDENT |

---

## 3. SubscriptionPlans

### Query

```sql
SELECT COUNT(*) AS Total FROM SubscriptionPlans;
SELECT TOP 5 Id, Code, Name, DurationDays, PriceVnd
FROM SubscriptionPlans ORDER BY Code;
```

### Tổng số record

| Total |
|-------|
| **3** |

### 5 record đầu tiên (toàn bộ bảng — 3 record)

| Id | Code | Name | DurationDays | PriceVnd |
|----|------|------|--------------|----------|
| `2966F115-51A2-45E0-9F20-87D0A0E87C9B` | 1m | 1 Month | 30 | 99,000.00 |
| `09574CE4-FB8A-4D9D-8E37-A4FAF2A31CB3` | 4y | 4 Years | 1,460 | 1,999,000.00 |
| `0C7C2A9C-031A-4E39-B8B0-0E6E6763BCF2` | 8m | 8 Months | 240 | 599,000.00 |

---

## 4. LevelConfigs

### Query

```sql
SELECT COUNT(*) AS Total FROM LevelConfigs;
SELECT TOP 5 Id, Name, MinPoints, VoucherPercent
FROM LevelConfigs ORDER BY MinPoints;
```

### Tổng số record

| Total |
|-------|
| **4** |

### 5 record đầu tiên (toàn bộ bảng — 4 record)

| Id | Name | MinPoints | VoucherPercent |
|----|------|-----------|----------------|
| `E3E852CE-FB5D-4930-86C8-B19A861609E9` | Bronze | 0 | NULL |
| `30C9961F-C6CE-4D8C-8905-E0B7C2A7BCE7` | Silver | 100 | 5 |
| `3DFE3DCA-33C9-42C4-9FB0-579D9FFA4410` | Gold | 500 | 10 |
| `3CE22C29-20D2-4A86-B535-F49344FE15F6` | Platinum | 2,000 | 15 |

---

## Summary

| Bảng | COUNT(*) | Records hiển thị | Validation |
|------|----------|------------------|------------|
| AspNetUsers | 1 | 1 / 1 | ✅ `admin@sehub.local` OK |
| AspNetRoles | 3 | 3 / 3 | ✅ Student, Moderator, Admin |
| SubscriptionPlans | 3 | 3 / 3 | ✅ 1m, 8m, 4y |
| LevelConfigs | 4 | 4 / 4 | ✅ Bronze → Platinum |

## Final Verdict

**DATABASE VALIDATION: PASS**

Tất cả dữ liệu seed kỳ vọng đã tồn tại trên `SEHubDb` tại thời điểm truy vấn. Không phát hiện lỗi kết nối hoặc thiếu dữ liệu.

---

_Validation thực hiện bằng `sqlcmd` trực tiếp trên SQL Server — không suy đoán._
